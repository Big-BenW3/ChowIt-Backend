import { describe, it, expect, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('security gates', () => {
  it('hides interactive docs in production', async () => {
    process.env.APP_ENV = 'production';
    process.env.OTP_CODE = 'test-only-code';
    const app = await buildApp();
    const docs = await app.inject({ method: 'GET', url: '/docs' });
    expect(docs.statusCode).toBe(404);
  });

  it('serves interactive docs outside production', async () => {
    const app = await buildApp();
    const docs = await app.inject({ method: 'GET', url: '/docs' });
    expect([200, 301, 302]).toContain(docs.statusCode);
  });

  it('throttles rapid OTP resends', async () => {
    const app = await buildApp();
    let last = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-otp',
      payload: { phone: '+2348012345678' },
    });
    for (let i = 0; i < 10; i += 1) {
      last = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/resend-otp',
        payload: { phone: '+2348012345678' },
      });
    }
    expect(last.statusCode).toBe(429);
    expect(last.json().error.code).toBe('RATE_LIMITED');
  });

  it('sends security headers on responses', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});
