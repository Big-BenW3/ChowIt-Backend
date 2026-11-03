import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { ApiError, badRequest, conflict, forbidden, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { getIdem, hashRequest, idemKey, setIdem } from '../shared/idempotency.js';
import { db, priceMenuItem, type Order, type Quote } from '../database/store.js';

// Checkout: expiring server-side quotes, then idempotent order creation.
// Quotes live 15 minutes; orders snapshot prices so later menu edits never
// rewrite history.
const QUOTE_TTL_MS = 15 * 60 * 1000;
const TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['confirmed', 'payment_failed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

function discountFor(code: string | undefined, subtotal: number): number {
  if (!code) return 0;
  const voucher = db.vouchers.find((v) => String(v.code).toUpperCase() === code.toUpperCase() && v.active === true) as
    | { code: string; discountType: string; discountValue: number; minimumOrderKobo: number; maxDiscountKobo: number }
    | undefined;
  if (!voucher || subtotal < voucher.minimumOrderKobo) return 0;
  if (voucher.discountType === 'percent') {
    return Math.min(Math.floor((subtotal * voucher.discountValue) / 100), voucher.maxDiscountKobo);
  }
  return Math.min(voucher.discountValue, voucher.maxDiscountKobo, subtotal);
}

export async function checkoutRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/checkout/quote', async (request) => {
    const customer = requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    const addressId = cleanText(body.addressId, 80);
    const voucherCode = cleanText(body.voucherCode, 32) || undefined;
    const cart = db.carts.get(customer.id);
    if (!cart || cart.items.length === 0) throw badRequest('VALIDATION_ERROR', 'Your cart is empty.');
    const address = db.addresses.get(addressId);
    if (!address || address.customerId !== customer.id) throw notFound('Delivery address not found.');
    let subtotal = 0;
    for (const line of cart.items) {
      const priced = priceMenuItem(line.menuItemId, line.selectedOptionIds, line.addonIds);
      if (priced.errors.length > 0) throw new ApiError(400, 'ITEM_UNAVAILABLE', priced.errors[0] as string);
      subtotal += priced.unitPrice * line.quantity;
    }
    const restaurant = db.restaurants.find((r) => r.id === cart.restaurantId) as
      | { minimumOrderKobo: number; deliveryFeeKobo: number; prepMinMinutes: number }
      | undefined;
    if (restaurant && subtotal < restaurant.minimumOrderKobo) {
      throw new ApiError(400, 'MINIMUM_ORDER_NOT_MET', 'This order is below the restaurant minimum.');
    }
    const discountKobo = discountFor(voucherCode, subtotal);
    const deliveryFeeKobo = (restaurant?.deliveryFeeKobo as number) ?? 100000;
    const quote: Quote = {
      id: newId('quote'), customerId: customer.id, addressId, subtotalKobo: subtotal,
      deliveryFeeKobo, serviceFeeKobo: 0, discountKobo, totalKobo: subtotal + deliveryFeeKobo - discountKobo,
      prepEta: (restaurant?.prepMinMinutes as number) ?? 25, deliveryEta: 45,
      expiresAt: Date.now() + QUOTE_TTL_MS, consumed: false,
    };
    db.quotes.set(quote.id, quote);
    return envelope({ ...quote, currency: 'NGN', addressServiceable: true, expiresAt: new Date(quote.expiresAt).toISOString() });
  });

  app.post('/api/v1/orders', async (request) => {
    const customer = requireCustomer(request);
    const idempotencyKey = cleanText(request.headers['idempotency-key'], 80);
    if (!idempotencyKey) throw badRequest('VALIDATION_ERROR', 'Idempotency-Key header is required.');
    const body = (request.body as Record<string, unknown>) ?? {};
    const key = idemKey(customer.id, 'create-order', idempotencyKey);
    const existing = getIdem(key);
    const requestHash = hashRequest(body);
    if (existing) {
      if (existing.requestHash !== requestHash) throw conflict('IDEMPOTENCY_KEY_REUSED', 'This key was used with different data.');
      return envelope(existing.response);
    }
    const quote = db.quotes.get(cleanText(body.quoteId, 80));
    if (!quote || quote.customerId !== customer.id || quote.consumed) {
      throw new ApiError(410, 'QUOTE_EXPIRED', 'This quote expired. Request a fresh quote.');
    }
    if (quote.expiresAt < Date.now()) throw new ApiError(410, 'QUOTE_EXPIRED', 'This quote expired. Request a fresh quote.');
    const cart = db.carts.get(customer.id);
    if (!cart || cart.items.length === 0) throw badRequest('VALIDATION_ERROR', 'Your cart is empty.');
    const address = db.addresses.get(quote.addressId);
    if (!address || address.customerId !== customer.id) throw new ApiError(400, 'ADDRESS_NOT_SERVICEABLE', 'Delivery address is not valid.');
    db.orderSeq += 1;
    const gift = body.gift as { enabled?: boolean; recipientName?: string; recipientPhone?: string; message?: string } | undefined;
    const order: Order = {
      id: newId('ord'), orderNumber: `CHW-${String(db.orderSeq).padStart(6, '0')}`,
      customerId: customer.id, restaurantId: cart.restaurantId,
      addressSnapshot: { ...address }, status: 'pending_payment', currency: 'NGN',
      subtotalKobo: quote.subtotalKobo, deliveryFeeKobo: quote.deliveryFeeKobo,
      serviceFeeKobo: 0, discountKobo: quote.discountKobo, totalKobo: quote.totalKobo,
      vendorNote: cleanText(body.vendorNote, 280),
      gift: {
        enabled: gift?.enabled === true,
        recipientName: cleanText(gift?.recipientName, 80),
        recipientPhone: cleanText(gift?.recipientPhone, 20),
        message: cleanText(gift?.message, 280),
      },
      items: cart.items.map((line) => {
        const priced = priceMenuItem(line.menuItemId, line.selectedOptionIds, line.addonIds);
        const item = db.menuItems.find((m) => m.id === line.menuItemId);
        return { ...line, itemName: item?.name ?? 'Meal', unitPriceKobo: priced.unitPrice, lineTotalKobo: priced.unitPrice * line.quantity };
      }),
      createdAt: new Date().toISOString(),
    };
    db.orders.set(order.id, order);
    db.orderEvents.push({ orderId: order.id, status: 'pending_payment', message: 'Order created.', actor: 'customer', createdAt: order.createdAt });
    quote.consumed = true;
    setIdem(key, requestHash, order);
    return envelope(order);
  });

  app.get('/api/v1/orders', async (request) => {
    const customer = requireCustomer(request);
    const query = request.query as { status?: string };
    let rows = [...db.orders.values()].filter((o) => o.customerId === customer.id);
    if (query.status === 'active') rows = rows.filter((o) => ['pending_payment', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status));
    else if (query.status === 'completed') rows = rows.filter((o) => o.status === 'delivered');
    else if (query.status === 'cancelled') rows = rows.filter((o) => ['cancelled', 'payment_failed'].includes(o.status));
    return envelope(rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  });

  app.get('/api/v1/orders/:orderId', async (request) => {
    const customer = requireCustomer(request);
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order || order.customerId !== customer.id) throw notFound('Order not found.');
    const timeline = db.orderEvents.filter((e) => e.orderId === orderId);
    return envelope({ ...order, timeline });
  });

  app.post('/api/v1/orders/:orderId/cancel', async (request) => {
    const customer = requireCustomer(request);
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order || order.customerId !== customer.id) throw notFound('Order not found.');
    if (!['pending_payment', 'confirmed'].includes(order.status)) throw forbidden('This order can no longer be cancelled.');
    order.status = 'cancelled';
    db.orderEvents.push({ orderId, status: 'cancelled', message: 'Cancelled by customer.', actor: 'customer', createdAt: new Date().toISOString() });
    return envelope(order);
  });

  app.post('/api/v1/orders/:orderId/reorder', async (request) => {
    const customer = requireCustomer(request);
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order || order.customerId !== customer.id) throw notFound('Order not found.');
    db.carts.set(customer.id, {
      id: newId('cart'), customerId: customer.id, restaurantId: order.restaurantId,
      items: (order.items as Array<Record<string, unknown>>).map((line) => ({
        id: newId('ci'), menuItemId: String(line.menuItemId), quantity: Number(line.quantity) || 1,
        selectedOptionIds: (line.selectedOptionIds as string[]) ?? [], addonIds: (line.addonIds as string[]) ?? [],
        note: String(line.note ?? ''),
      })),
      updatedAt: new Date().toISOString(),
    });
    return envelope(db.carts.get(customer.id));
  });

  app.post('/api/v1/orders/:orderId/review', async (request) => {
    const customer = requireCustomer(request);
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order || order.customerId !== customer.id) throw notFound('Order not found.');
    if (order.status !== 'delivered') throw forbidden('You can review an order after delivery.');
    if (db.reviews.some((r) => r.orderId === orderId)) throw conflict('IDEMPOTENCY_KEY_REUSED', 'This order already has a review.');
    const body = (request.body as Record<string, unknown>) ?? {};
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw badRequest('VALIDATION_ERROR', 'Rating must be 1 to 5.');
    const review = { id: newId('rev'), orderId, customerId: customer.id, restaurantId: order.restaurantId, rating, comment: cleanText(body.comment, 500), createdAt: new Date().toISOString() };
    db.reviews.push(review);
    return envelope(review);
  });

  void TRANSITIONS;
}
