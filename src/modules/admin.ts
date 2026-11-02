import type { FastifyInstance } from 'fastify';
import { badRequest, forbidden, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db } from '../database/store.js';

const STAFF_PHONES = (process.env.STAFF_PHONES ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/admin/orders', async (request) => {
    const customer = requireCustomer(request);
    if (STAFF_PHONES.length > 0 && !STAFF_PHONES.includes(customer.phone)) {
      throw forbidden('Staff access only.');
    }
    return envelope([...db.orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50));
  });

  app.patch('/api/v1/admin/orders/:orderId/status', async (request) => {
    const customer = requireCustomer(request);
    if (STAFF_PHONES.length > 0 && !STAFF_PHONES.includes(customer.phone)) {
      throw forbidden('Staff access only.');
    }
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order) throw notFound('Order not found.');
    const body = (request.body as Record<string, unknown>) ?? {};
    const status = cleanText(body.status, 30);
    const allowed = ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) throw badRequest('VALIDATION_ERROR', 'This status change is not allowed.');
    order.status = status as typeof order.status;
    db.orderEvents.push({ orderId, status, message: cleanText(body.note, 280) || `Status set to ${status}.`, actor: `staff:${customer.id}`, createdAt: new Date().toISOString() });
    return envelope(order);
  });

  app.patch('/api/v1/admin/menu-items/:menuItemId/availability', async (request) => {
    const customer = requireCustomer(request);
    if (STAFF_PHONES.length > 0 && !STAFF_PHONES.includes(customer.phone)) {
      throw forbidden('Staff access only.');
    }
    const { menuItemId } = request.params as { menuItemId: string };
    const item = db.menuItems.find((m) => m.id === menuItemId);
    if (!item) throw notFound('Meal not found.');
    const body = (request.body as Record<string, unknown>) ?? {};
    item.isAvailable = body.isAvailable === true;
    return envelope(item);
  });
}
