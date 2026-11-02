import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { badRequest, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db } from '../database/store.js';

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/wallet', async (request) => {
    requireCustomer(request);
    return envelope({ balanceKobo: 0, currency: 'NGN', available: false, message: 'ChowIt wallet is coming soon.' });
  });

  app.get('/api/v1/wallet/transactions', async (request) => {
    requireCustomer(request);
    return envelope([]);
  });

  app.get('/api/v1/referrals/me', async (request) => {
    const customer = requireCustomer(request);
    return envelope({ code: customer.referralCode, terms: 'Share your code. Rewards launch soon.' });
  });

  app.get('/api/v1/referrals/history', async (request) => {
    const customer = requireCustomer(request);
    return envelope(db.referrals.filter((r) => r.referrerCustomerId === customer.id));
  });

  app.get('/api/v1/vouchers', async (request) => {
    const customer = requireCustomer(request);
    const used = db.usedVouchers.filter((u) => u.customerId === customer.id).map((u) => u.voucherId);
    return envelope(db.vouchers.map((v) => ({ ...v, state: used.includes(String(v.id)) ? 'used' : 'available' })));
  });

  app.post('/api/v1/vouchers/validate', async (request) => {
    requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    const code = cleanText(body.voucherCode, 32).toUpperCase();
    const voucher = db.vouchers.find((v) => String(v.code).toUpperCase() === code && v.active === true);
    if (!voucher) throw notFound('Voucher not found or expired.');
    return envelope({ valid: true, voucher });
  });

  app.get('/api/v1/gift-cards', async (request) => {
    const customer = requireCustomer(request);
    return envelope(db.giftCards.filter((g) => g.ownerCustomerId === customer.id));
  });

  app.post('/api/v1/gift-cards/redeem', async (request) => {
    const customer = requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    const code = cleanText(body.code, 32);
    if (!code) throw badRequest('VALIDATION_ERROR', 'Enter a gift-card code.');
    const card = db.giftCards.find((g) => String(g.code).toUpperCase() === code.toUpperCase());
    if (!card) throw notFound('Gift card not found.');
    card.ownerCustomerId = customer.id;
    card.status = 'redeemed';
    return envelope(card);
  });

  app.get('/api/v1/customers/me/preferences', async (request) => {
    requireCustomer(request);
    return envelope({ notifications: true, theme: 'system' });
  });

  app.patch('/api/v1/customers/me/preferences', async (request) => {
    requireCustomer(request);
    return envelope({ updated: true });
  });

  app.patch('/api/v1/customers/me', async (request) => {
    const customer = requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    if (body.fullName !== undefined) customer.fullName = cleanText(body.fullName, 80) || customer.fullName;
    return envelope({ ...customer, passwordHash: undefined });
  });

  void newId;
}
