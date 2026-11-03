import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { ApiError, badRequest, conflict, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { getIdem, hashRequest, idemKey, setIdem } from '../shared/idempotency.js';
import { db, type Payment } from '../database/store.js';
import type { Env } from '../config/env.js';

// Demo payments only. mock-complete refuses to run unless
// PAYMENT_MODE=mock; in live mode completions must arrive via verified
// provider webhooks (see docs/v2/V2_PAYMENTS_OTP.md).
const METHODS = ['CARD', 'BANK_TRANSFER', 'USSD'];

export async function paymentRoutes(app: FastifyInstance, env: Env): Promise<void> {
  app.get('/api/v1/payment-methods', async () => envelope(
    METHODS.map((method) => ({ method, available: true, mode: env.paymentMode })),
  ));

  app.post('/api/v1/orders/:orderId/payment-attempts', async (request) => {
    const customer = requireCustomer(request);
    const idempotencyKey = cleanText(request.headers['idempotency-key'], 80);
    if (!idempotencyKey) throw badRequest('VALIDATION_ERROR', 'Idempotency-Key header is required.');
    const { orderId } = request.params as { orderId: string };
    const order = db.orders.get(orderId);
    if (!order || order.customerId !== customer.id) throw notFound('Order not found.');
    const body = (request.body as Record<string, unknown>) ?? {};
    const method = cleanText(body.method, 20).toUpperCase();
    if (!METHODS.includes(method)) {
      throw new ApiError(400, 'PAYMENT_METHOD_UNAVAILABLE', 'This payment method is not available.');
    }
    const key = idemKey(customer.id, `pay-${orderId}`, idempotencyKey);
    const existing = getIdem(key);
    const requestHash = hashRequest({ orderId, method });
    if (existing) {
      if (existing.requestHash !== requestHash) throw conflict('IDEMPOTENCY_KEY_REUSED', 'This key was used with different data.');
      return envelope(existing.response);
    }
    const payment: Payment = {
      id: newId('pay'), orderId, customerId: customer.id, method, mode: env.paymentMode,
      status: 'pending', amountKobo: order.totalKobo, receiptReference: null,
      createdAt: new Date().toISOString(), completedAt: null,
    };
    db.payments.set(payment.id, payment);
    setIdem(key, requestHash, payment);
    return envelope(payment);
  });

  app.get('/api/v1/payments/:paymentId', async (request) => {
    const customer = requireCustomer(request);
    const { paymentId } = request.params as { paymentId: string };
    const payment = db.payments.get(paymentId);
    if (!payment || payment.customerId !== customer.id) throw notFound('Payment not found.');
    return envelope(payment);
  });

  app.post('/api/v1/payments/:paymentId/mock-complete', async (request) => {
    const customer = requireCustomer(request);
    if (env.paymentMode !== 'mock') {
      throw new ApiError(403, 'MOCK_PAYMENT_DISABLED', 'Mock completion is disabled in live mode.');
    }
    const { paymentId } = request.params as { paymentId: string };
    const payment = db.payments.get(paymentId);
    if (!payment || payment.customerId !== customer.id) throw notFound('Payment not found.');
    if (payment.status !== 'pending') return envelope(payment);
    const body = (request.body as Record<string, unknown>) ?? {};
    const fail = body.simulate === 'fail';
    payment.status = fail ? 'failed' : 'succeeded';
    payment.completedAt = new Date().toISOString();
    payment.receiptReference = `CHW-DEMO-${payment.id.slice(-6).toUpperCase()}`;
    const order = db.orders.get(payment.orderId);
    if (order) {
      order.status = fail ? 'payment_failed' : 'confirmed';
      db.orderEvents.push({
        orderId: order.id,
        status: order.status,
        message: fail ? 'Demo payment failed.' : 'Demo payment completed. No money was charged.',
        actor: 'system',
        createdAt: new Date().toISOString(),
      });
    }
    if (!fail) db.carts.delete(customer.id);
    return envelope({
      paymentId: payment.id,
      paymentStatus: payment.status,
      paymentMode: 'mock',
      message: fail ? 'Demo payment failed.' : 'Demo payment completed. No money was charged.',
      receiptReference: payment.receiptReference,
      order: order ? { id: order.id, orderNumber: order.orderNumber, status: order.status } : null,
    });
  });
}
