import type { FastifyInstance } from 'fastify';
import { newId } from '../shared/auth.js';
import { badRequest, notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db } from '../database/store.js';
import { loadSeed } from '../database/seed.js';

// Public content (FAQs, legal) plus the customer's own support tickets
// and notifications. Support replies arrive through ticket status.
export async function contentRoutes(app: FastifyInstance): Promise<void> {
  const seed = loadSeed();

  app.get('/api/v1/content/faqs', async () => envelope(seed.faqs));
  app.get('/api/v1/content/faqs/:faqId', async (request) => {
    const { faqId } = request.params as { faqId: string };
    const faq = seed.faqs.find((f) => f.id === faqId);
    if (!faq) throw notFound('FAQ not found.');
    return envelope(faq);
  });

  app.get('/api/v1/content/legal/:documentType', async (request) => {
    const { documentType } = request.params as { documentType: string };
    const doc = seed.legal.find((d) => d.documentType === documentType);
    if (!doc) throw notFound('Document not found.');
    return envelope(doc);
  });

  app.post('/api/v1/support/tickets', async (request) => {
    const customer = requireCustomer(request);
    const body = (request.body as Record<string, unknown>) ?? {};
    const message = cleanText(body.message, 2000);
    if (!message) throw badRequest('VALIDATION_ERROR', 'Tell us what you need help with.');
    const ticket = {
      id: newId('tkt'), customerId: customer.id,
      orderId: cleanText(body.orderId, 80) || null,
      topic: cleanText(body.topic, 40) || 'GENERAL',
      message, status: 'open', createdAt: new Date().toISOString(),
    };
    db.tickets.push(ticket);
    return envelope({ ...ticket, reference: ticket.id.toUpperCase() });
  });

  app.get('/api/v1/support/tickets', async (request) => {
    const customer = requireCustomer(request);
    return envelope(db.tickets.filter((t) => t.customerId === customer.id));
  });

  app.get('/api/v1/notifications', async (request) => {
    const customer = requireCustomer(request);
    return envelope(db.notifications.filter((n) => n.customerId === customer.id));
  });

  app.patch('/api/v1/notifications/:notificationId/read', async (request) => {
    const customer = requireCustomer(request);
    const { notificationId } = request.params as { notificationId: string };
    const note = db.notifications.find((n) => n.id === notificationId && n.customerId === customer.id);
    if (!note) throw notFound('Notification not found.');
    note.readAt = new Date().toISOString();
    return envelope(note);
  });

  app.post('/api/v1/devices/push-tokens', async (request) => {
    requireCustomer(request);
    return envelope({ registered: true });
  });
}
