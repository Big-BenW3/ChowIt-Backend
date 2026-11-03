// Per-request customer resolution from the Bearer token. Every
// customer-owned route calls requireCustomer first, then filters by its id.
import type { FastifyRequest } from 'fastify';
import { hashToken } from '../shared/auth.js';
import { unauthorized } from '../shared/errors.js';
import { db, type Customer } from '../database/store.js';

export function requireCustomer(request: FastifyRequest): Customer {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw unauthorized('UNAUTHENTICATED', 'Sign in to continue.');
  const session = db.sessions.get(hashToken(token));
  if (!session || session.revokedAt !== null || session.expiresAt < Date.now()) {
    throw unauthorized('UNAUTHENTICATED', 'Your session expired. Sign in again.');
  }
  const customer = db.customers.get(session.customerId);
  if (!customer) throw unauthorized('UNAUTHENTICATED', 'Account not found.');
  return customer;
}

export function envelope(data: unknown, meta?: Record<string, unknown>): Record<string, unknown> {
  return { data, meta: { requestId: `req_${Date.now().toString(36)}`, ...(meta ?? {}) } };
}
