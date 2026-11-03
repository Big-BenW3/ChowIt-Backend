import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { ApiError, badRequest, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
// One cart per customer, one restaurant per cart. Clients send only ids,
// quantities, and notes; every amount in the response is recomputed here.
import { db, priceMenuItem, cartSubtotal, type Cart } from '../database/store.js';

function presentCart(cart: Cart): Record<string, unknown> {
  const items = cart.items.map((line) => {
    const priced = priceMenuItem(line.menuItemId, line.selectedOptionIds, line.addonIds);
    const item = db.menuItems.find((m) => m.id === line.menuItemId);
    return { ...line, itemName: item?.name ?? 'Meal', unitPriceKobo: priced.unitPrice, lineTotalKobo: priced.unitPrice * line.quantity };
  });
  return { ...cart, items, subtotalKobo: cartSubtotal(cart) };
}

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/cart', async (request) => {
    const customer = requireCustomer(request);
    const cart = db.carts.get(customer.id);
    if (!cart) return envelope({ items: [], subtotalKobo: 0 });
    return envelope(presentCart(cart));
  });

  app.post('/api/v1/cart/items', async (request) => {
    const customer = requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    const menuItemId = cleanText(body.menuItemId, 80);
    const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 20);
    const selectedOptionIds = Array.isArray(body.selectedOptionIds)
      ? (body.selectedOptionIds as unknown[]).map((o) => cleanText(o, 80))
      : [];
    const addonIds = Array.isArray(body.addonIds)
      ? (body.addonIds as unknown[]).map((a) => cleanText(a, 80))
      : [];
    const note = cleanText(body.note, 280);
    const priced = priceMenuItem(menuItemId, selectedOptionIds, addonIds);
    if (!priced.restaurantId) throw badRequest('ITEM_UNAVAILABLE', 'This meal does not exist.');
    if (priced.errors.length > 0) throw new ApiError(400, 'ITEM_UNAVAILABLE', priced.errors[0] as string);
    let cart = db.carts.get(customer.id);
    if (cart && cart.restaurantId !== priced.restaurantId) {
      throw new ApiError(409, 'CART_RESTAURANT_MISMATCH', 'Your cart has items from another restaurant.');
    }
    if (!cart) {
      cart = { id: newId('cart'), customerId: customer.id, restaurantId: priced.restaurantId, items: [], updatedAt: new Date().toISOString() };
      db.carts.set(customer.id, cart);
    }
    cart.items.push({ id: newId('ci'), menuItemId, quantity, selectedOptionIds, addonIds, note });
    cart.updatedAt = new Date().toISOString();
    return envelope(presentCart(cart));
  });

  app.patch('/api/v1/cart/items/:cartItemId', async (request) => {
    const customer = requireCustomer(request);
    const { cartItemId } = request.params as { cartItemId: string };
    const cart = db.carts.get(customer.id);
    const line = cart?.items.find((i) => i.id === cartItemId);
    if (!cart || !line) throw notFound('Cart item not found.');
    const body = (request.body as Record<string, unknown>) ?? {};
    if (body.quantity !== undefined) line.quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 20);
    if (body.note !== undefined) line.note = cleanText(body.note, 280);
    cart.updatedAt = new Date().toISOString();
    return envelope(presentCart(cart));
  });

  app.delete('/api/v1/cart/items/:cartItemId', async (request) => {
    const customer = requireCustomer(request);
    const { cartItemId } = request.params as { cartItemId: string };
    const cart = db.carts.get(customer.id);
    if (!cart) throw notFound('Cart item not found.');
    cart.items = cart.items.filter((i) => i.id !== cartItemId);
    if (cart.items.length === 0) db.carts.delete(customer.id);
    return envelope({ removed: true });
  });

  app.delete('/api/v1/cart', async (request) => {
    const customer = requireCustomer(request);
    db.carts.delete(customer.id);
    return envelope({ cleared: true });
  });
}
