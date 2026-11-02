import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { registerLoginAndAddress } from './helpers.js';

describe('cart rules', () => {
  it('rejects a second restaurant and prices server-side', async () => {
    const app = await buildApp();
    const { token } = await registerLoginAndAddress(app, 'cart');
    const home = await app.inject({ method: 'GET', url: '/api/v1/home', headers: { authorization: `Bearer ${token}` } });
    const meals = home.json().data.specials as Array<{ id: string; restaurantId: string }>;
    const first = meals[0];
    const other = meals.find((m) => m.restaurantId !== first.restaurantId);
    expect(other).toBeDefined();
    const detail = await app.inject({ method: 'GET', url: `/api/v1/menu-items/${first.id}` });
    const groups = detail.json().data.optionGroups as Array<{ id: string; options: Array<{ id: string }> }>;
    const selected = groups.map((g) => g.options[0]?.id).filter(Boolean);
    const add = await app.inject({
      method: 'POST', url: '/api/v1/cart/items',
      headers: { authorization: `Bearer ${token}` },
      payload: { menuItemId: first.id, quantity: 2, selectedOptionIds: selected, price: 1, total: 1 },
    });
    expect(add.statusCode).toBe(200);
    const cart = add.json().data as { subtotalKobo: number; items: Array<{ unitPriceKobo: number }> };
    expect(cart.subtotalKobo).toBe(cart.items[0].unitPriceKobo * 2);
    expect(cart.subtotalKobo).not.toBe(2);
    const clash = await app.inject({
      method: 'POST', url: '/api/v1/cart/items',
      headers: { authorization: `Bearer ${token}` },
      payload: { menuItemId: other!.id, quantity: 1 },
    });
    expect(clash.statusCode).toBe(409);
    expect(clash.json().error.code).toBe('CART_RESTAURANT_MISMATCH');
  });

  it('rejects unavailable meals', async () => {
    const app = await buildApp();
    const { token } = await registerLoginAndAddress(app, 'unavail');
    const res = await app.inject({
      method: 'POST', url: '/api/v1/cart/items',
      headers: { authorization: `Bearer ${token}` },
      payload: { menuItemId: 'meal_nkwobicorner_4', quantity: 1 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('ITEM_UNAVAILABLE');
  });
});
