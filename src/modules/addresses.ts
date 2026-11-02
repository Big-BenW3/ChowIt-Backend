import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { badRequest, forbidden, notFound } from '../shared/errors.js';
import { cleanText, normalizePhone } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db, type Address } from '../database/store.js';

function readAddress(body: Record<string, unknown>): Omit<Address, 'id' | 'customerId'> {
  const label = cleanText(body.label, 20) || 'Home';
  const recipientName = cleanText(body.recipientName, 80);
  const recipientPhone = normalizePhone(String(body.recipientPhone ?? ''));
  const line1 = cleanText(body.line1, 160);
  if (!recipientName) throw badRequest('VALIDATION_ERROR', 'Recipient name is required.', { recipientName: 'Required.' });
  if (!recipientPhone) throw badRequest('VALIDATION_ERROR', 'Enter a valid recipient phone.', { recipientPhone: 'Enter a valid phone number.' });
  if (!line1) throw badRequest('VALIDATION_ERROR', 'Street address is required.', { line1: 'Required.' });
  return {
    label,
    recipientName,
    recipientPhone,
    line1,
    line2: cleanText(body.line2, 160) || null,
    landmark: cleanText(body.landmark, 160),
    city: cleanText(body.city, 60) || 'Onitsha',
    state: cleanText(body.state, 60) || 'Anambra',
    deliveryInstructions: cleanText(body.deliveryInstructions, 280),
    latitude: typeof body.latitude === 'number' ? body.latitude : null,
    longitude: typeof body.longitude === 'number' ? body.longitude : null,
    isDefault: body.isDefault === true,
  };
}

export async function addressRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/addresses', async (request) => {
    const customer = requireCustomer(request);
    const rows = [...db.addresses.values()].filter((a) => a.customerId === customer.id);
    return envelope(rows);
  });

  app.post('/api/v1/addresses', async (request) => {
    const customer = requireCustomer(request);
    const parsed = readAddress((request.body as Record<string, unknown>) ?? {});
    const existing = [...db.addresses.values()].filter((a) => a.customerId === customer.id);
    const address: Address = { id: newId('addr'), customerId: customer.id, ...parsed, isDefault: existing.length === 0 ? true : parsed.isDefault };
    if (address.isDefault) existing.forEach((a) => { a.isDefault = false; });
    db.addresses.set(address.id, address);
    return envelope(address);
  });

  app.patch('/api/v1/addresses/:addressId/default', async (request) => {
    const customer = requireCustomer(request);
    const { addressId } = request.params as { addressId: string };
    const address = db.addresses.get(addressId);
    if (!address || address.customerId !== customer.id) throw notFound('Address not found.');
    [...db.addresses.values()].filter((a) => a.customerId === customer.id).forEach((a) => { a.isDefault = a.id === addressId; });
    return envelope(address);
  });

  app.delete('/api/v1/addresses/:addressId', async (request) => {
    const customer = requireCustomer(request);
    const { addressId } = request.params as { addressId: string };
    const address = db.addresses.get(addressId);
    if (!address || address.customerId !== customer.id) throw notFound('Address not found.');
    const activeOrders = [...db.orders.values()].filter((o) => o.customerId === customer.id && !['delivered', 'cancelled'].includes(o.status));
    if (address.isDefault && activeOrders.length > 0) throw forbidden('Set another default address before deleting this one.');
    db.addresses.delete(addressId);
    return envelope({ deleted: true });
  });

  app.get('/api/v1/delivery/coverage', async (request) => {
    requireCustomer(request);
    return envelope({ serviceable: true, deliveryFeeKobo: 100000, etaMinutes: 45 });
  });
}
