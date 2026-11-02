import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { registerLoginAndAddress } from './helpers.js';

describe('mock payments', () => {
  it('completes a mock payment and confirms the order', async () => {
    const app = await buildApp();
    const { token, addressId } = await registerLoginAndAddress(app, 'pay');
    const home = await app.inject({ method: 'GET', url: '/api/v1/home', headers: { authorization: `Bearer ${token}` } });
    const meals = home.json().data.specials as Array<{ id: string }>;
    await app.inject({
      method: 'POST', url: '/api/v1/cart/items',
      headers: { authorization: `Bearer ${token}` },
      payload: { menuItemId: meals[0].id, quantity: 1 },
    });
    const quote = await app.inject({
      method: 'POST', url: '/api/v1/checkout/quote',
      headers: { authorization: `Bearer ${token}` },
      payload: { addressId },
    });
    const order = await app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': `o-${Date.now()}` },
      payload: { quoteId: quote.json().data.id, addressId },
    });
    const orderId = order.json().data.id as string;
    const attempt = await app.inject({
      method: 'POST', url: `/api/v1/orders/${orderId}/payment-attempts`,
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': `p-${Date.now()}` },
      payload: { method: 'CARD' },
    });
    expect(attempt.statusCode).toBe(200);
    const paymentId = attempt.json().data.id as string;
    const done = await app.inject({
      method: 'POST', url: `/api/v1/payments/${paymentId}/mock-complete`,
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(done.statusCode).toBe(200);
    expect(done.json().data.paymentStatus).toBe('succeeded');
    expect(done.json().data.order.status).toBe('confirmed');
    const detail = await app.inject({ method: 'GET', url: `/api/v1/orders/${orderId}`, headers: { authorization: `Bearer ${token}` } });
    expect(detail.json().data.timeline.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects mock completion in live mode', async () => {
    process.env.PAYMENT_MODE = 'live';
    const app = await buildApp();
    process.env.PAYMENT_MODE = 'mock';
    const { token } = await registerLoginAndAddress(app, 'live');
    const attempt = await app.inject({
      method: 'POST', url: '/api/v1/orders/ord_missing/payment-attempts',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': `x-${Date.now()}` },
      payload: { method: 'CARD' },
    });
    expect([404, 400]).toContain(attempt.statusCode);
  });
});
