import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

describe('auth', () => {
  it('registers, verifies and returns the customer profile', async () => {
    const app = await buildApp();
    const phone = `+23481${String(1000000 + Math.floor(Math.random() * 8999999))}`;
    const register = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { phone, fullName: 'Ada Okafor', username: `ada_${Date.now().toString(36)}`, password: 'password123' } });
    expect(register.statusCode).toBe(200);
    expect(register.json().data.verificationRequired).toBe(true);
    const bad = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { phone, fullName: 'Ada Okafor', username: 'someone_else', password: 'password123' } });
    expect(bad.statusCode).toBe(409);
    expect(bad.json().error.code).toBe('PHONE_ALREADY_REGISTERED');
    const verify = await app.inject({ method: 'POST', url: '/api/v1/auth/verify-phone', payload: { phone, code: process.env.OTP_CODE ?? '123456' } });
    expect(verify.statusCode).toBe(200);
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone, password: 'password123' } });
    expect(login.statusCode).toBe(200);
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${login.json().data.token}` } });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.phone).toBe(phone);
  });

  it('rejects bad credentials and unauthenticated access', async () => {
    const app = await buildApp();
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone: '+2348000000000', password: 'wrongpass1' } });
    expect(login.statusCode).toBe(401);
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(me.statusCode).toBe(401);
  });
});
