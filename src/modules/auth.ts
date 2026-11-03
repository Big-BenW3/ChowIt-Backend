import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
// Identity: register → OTP verify → login/logout, plus password reset.
// Login and OTP routes carry stricter per-route rate limits (see below)
// because they are the brute-force targets.
import { hashPassword, verifyPassword, newSessionToken, newId, hashToken } from '../shared/auth.js';
import { ApiError, badRequest, conflict, notFound, unauthorized } from '../shared/errors.js';
import { cleanText, normalizePhone, normalizeUsername } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db, resetStore, type Customer } from '../database/store.js';
import { authRateLimit, otpRateLimit } from '../plugins/security.js';
import { loadSeed } from '../database/seed.js';
import type { Env } from '../config/env.js';

let seeded = false;
function ensureSeed(): void {
  if (seeded) return;
  seeded = true;
  resetStore();
}

function publicCustomer(customer: Customer): Omit<Customer, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = customer;
  void _passwordHash;
  return rest;
}

export async function authRoutes(app: FastifyInstance, env: Env): Promise<void> {
  ensureSeed();

  const registerSchema = {
    body: Type.Object({
      phone: Type.String(),
      fullName: Type.String(),
      username: Type.String(),
      password: Type.String(),
    }),
  };

  app.post(
    '/api/v1/auth/register',
    { schema: registerSchema, config: { rateLimit: authRateLimit } },
    async (request) => {
    const body = request.body as { phone: string; fullName: string; username: string; password: string };
    const phone = normalizePhone(body.phone);
    const fullName = cleanText(body.fullName, 80);
    const username = normalizeUsername(body.username);
    if (!phone) throw badRequest('VALIDATION_ERROR', 'Enter a valid phone number.', { phone: 'Enter a valid phone number.' });
    if (fullName.length < 2) throw badRequest('VALIDATION_ERROR', 'Enter your full name.', { fullName: 'Enter your full name.' });
    if (username.length < 3) throw badRequest('USERNAME_TAKEN', 'Choose a username with at least 3 characters.');
    if (!body.password || body.password.length < 8) {
      throw badRequest('VALIDATION_ERROR', 'Password needs at least 8 characters.', { password: 'Use at least 8 characters.' });
    }
    if ([...db.customers.values()].some((c) => c.phone === phone)) {
      throw conflict('PHONE_ALREADY_REGISTERED', 'This phone number is already registered.');
    }
    if ([...db.customers.values()].some((c) => c.username === username)) {
      throw conflict('USERNAME_TAKEN', 'This username is taken.');
    }
    const id = newId('cus');
    const customer = {
      id, fullName, username, phone,
      passwordHash: await hashPassword(body.password),
      phoneVerifiedAt: null,
      referralCode: username.toUpperCase().slice(0, 8) + '-CHW',
      createdAt: new Date().toISOString(),
    };
    db.customers.set(id, customer);
    db.otps.set(phone, { code: env.otpCode, purpose: 'verify', expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
    return envelope({ ...publicCustomer(customer), verificationRequired: true, maskedPhone: phone.slice(0, 7) + '****' });
  });

  app.post(
    '/api/v1/auth/verify-phone',
    { config: { rateLimit: otpRateLimit } },
    async (request) => {
    const body = request.body as { phone?: string; code?: string };
    const phone = normalizePhone(String(body.phone ?? ''));
    const code = cleanText(body.code, 10);
    if (!phone) throw badRequest('VALIDATION_ERROR', 'Enter a valid phone number.');
    const record = db.otps.get(phone);
    if (!record || record.expiresAt < Date.now()) throw new ApiError(410, 'OTP_EXPIRED', 'This code expired. Request a new one.');
    if (record.attempts >= 5) throw new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Request a new code.');
    if (record.code !== code) {
      record.attempts += 1;
      throw new ApiError(400, 'OTP_INVALID', 'This code is not correct.');
    }
    db.otps.delete(phone);
    const customer = [...db.customers.values()].find((c) => c.phone === phone);
    if (!customer) throw notFound('Account not found.');
    customer.phoneVerifiedAt = new Date().toISOString();
    return envelope({ verified: true });
  });

  app.post(
    '/api/v1/auth/resend-otp',
    { config: { rateLimit: otpRateLimit } },
    async (request) => {
    const body = request.body as { phone?: string };
    const phone = normalizePhone(String(body.phone ?? ''));
    if (!phone) throw badRequest('VALIDATION_ERROR', 'Enter a valid phone number.');
    db.otps.set(phone, { code: env.otpCode, purpose: 'verify', expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
    return envelope({ sent: true, maskedPhone: phone.slice(0, 7) + '****' });
  });

  app.post(
    '/api/v1/auth/login',
    { config: { rateLimit: authRateLimit } },
    async (request) => {
    const body = request.body as { phone?: string; password?: string };
    const phone = normalizePhone(String(body.phone ?? ''));
    if (!phone) throw badRequest('VALIDATION_ERROR', 'Enter a valid phone number.');
    const customer = [...db.customers.values()].find((c) => c.phone === phone);
    if (!customer) throw unauthorized('INVALID_CREDENTIALS', 'Phone number or password is incorrect.');
    const ok = await verifyPassword(customer.passwordHash, String(body.password ?? ''));
    if (!ok) throw unauthorized('INVALID_CREDENTIALS', 'Phone number or password is incorrect.');
    if (!customer.phoneVerifiedAt) throw new ApiError(403, 'FORBIDDEN', 'Verify your phone number first.');
    const { token, tokenHash } = newSessionToken();
    db.sessions.set(tokenHash, {
      id: newId('ses'), customerId: customer.id, tokenHash,
      expiresAt: Date.now() + env.sessionTtlHours * 3600 * 1000, revokedAt: null,
    });
    return envelope({ token, customer: publicCustomer(customer) });
  });

  app.post('/api/v1/auth/logout', async (request) => {
    const customer = requireCustomer(request);
    const header = request.headers.authorization ?? '';
    const session = db.sessions.get(hashToken(header.slice(7).trim()));
    if (session && session.customerId === customer.id) session.revokedAt = Date.now();
    return envelope({ loggedOut: true });
  });

  app.get('/api/v1/auth/me', async (request) => {
    const customer = requireCustomer(request);
    const addresses = [...db.addresses.values()].filter((a) => a.customerId === customer.id);
    return envelope({ ...publicCustomer(customer), addressSetupComplete: addresses.length > 0 });
  });

  app.post(
    '/api/v1/auth/password/forgot',
    { config: { rateLimit: otpRateLimit } },
    async (request) => {
    const body = request.body as { phone?: string };
    const phone = normalizePhone(String(body.phone ?? ''));
    if (!phone) throw badRequest('VALIDATION_ERROR', 'Enter a valid phone number.');
    db.otps.set(phone, { code: env.otpCode, purpose: 'reset', expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
    return envelope({ sent: true });
  });

  app.post(
    '/api/v1/auth/password/reset',
    { config: { rateLimit: otpRateLimit } },
    async (request) => {
    const body = request.body as { phone?: string; code?: string; newPassword?: string };
    const phone = normalizePhone(String(body.phone ?? ''));
    const record = phone ? db.otps.get(phone) : undefined;
    if (!record || record.purpose !== 'reset' || record.expiresAt < Date.now()) {
      throw new ApiError(410, 'OTP_EXPIRED', 'This code expired. Request a new one.');
    }
    if (record.code !== cleanText(body.code, 10)) throw new ApiError(400, 'OTP_INVALID', 'This code is not correct.');
    if (!body.newPassword || body.newPassword.length < 8) {
      throw badRequest('VALIDATION_ERROR', 'Password needs at least 8 characters.');
    }
    const customer = [...db.customers.values()].find((c) => c.phone === phone);
    if (!customer) throw notFound('Account not found.');
    customer.passwordHash = await hashPassword(body.newPassword);
    db.otps.delete(phone!);
    return envelope({ updated: true });
  });

  // Demo helper used by tests to inspect the seeded catalogue size.
  void loadSeed;
}
