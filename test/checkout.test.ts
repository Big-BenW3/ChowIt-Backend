import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { registerLoginAndAddress } from './helpers.js';

async function cartWithItem(app: Awaited<ReturnType<typeof buildApp>>, token: string): Promise<void> {
  const home = await app.inject({ method: 'GET', url: '/api/v1/home', headers: { authorization: `Bearer ${token}` } });
  const meals = home.json().data.specials as Array<{ id: string }>;
  await app.inject({
    method: 'POST', url: '/api/v1/cart/items',
    headers: { authorization: `Bearer ${token}` },
    payload: { menuItemId: meals[0].id, quantity: 1 },
  });
}

describe('checkout and orders', () => {
  it('creates idempotent orders from a server quote', async () => {
    const app = await buildApp();
    const { token, addressId } = await registerLoginAndAddress(app, 'order');
    await cartWithItem(app, token);
    const quote = await app.inject({
      method: 'POST', url: '/api/v1/checkout/quote',
      headers: { authorization: `Bearer ${token}` },
      payload: { addressId },
    });
    expect(quote.statusCode).toBe(200);
    const quoteId = quote.json().data.id as string;
    const key = `key-${Date.now()}`;
    const first = await app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': key },
      payload: { quoteId, addressId },
    });
    expect(first.statusCode).toBe(200);
    const orderId = first.json().data.id as string;
    const retry = await app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': key },
      payload: { quoteId, addressId },
    });
    expect(retry.statusCode).toBe(200);
    expect(retry.json().data.id).toBe(orderId);
    const list = await app.inject({ method: 'GET', url: '/api/v1/orders?status=active', headers: { authorization: `Bearer ${token}` } });
    expect(list.json().data.length).toBe(1);
  });

  it('rejects reused keys with different payloads and consumed quotes', async () => {
    const app = await buildApp();
    const { token, addressId } = await registerLoginAndAddress(app, 'idem');
    await cartWithItem(app, token);
    const quote = await app.inject({
      method: 'POST', url: '/api/v1/checkout/quote',
      headers: { authorization: `Bearer ${token}` },
      payload: { addressId },
    });
    const quoteId = quote.json().data.id as string;
    const key = `key2-${Date.now()}`;
    await app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': key },
      payload: { quoteId, addressId },
    });
    const clash = await app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': key },
      payload: { quoteId, addressId, vendorNote: 'different payload' },
    });
    expect(clash.statusCode).toBe(409);
    expect(clash.json().error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });
});
