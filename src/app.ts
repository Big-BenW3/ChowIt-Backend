// Builds the Fastify instance: security plugins, error envelope, then one
// module per product area. trustProxy is on so rate limits see the real
// client IP behind Render's proxy.
import Fastify, { type FastifyInstance } from 'fastify';
import { loadEnv } from './config/env.js';
import { registerSecurity } from './plugins/security.js';
import { resetStore } from './database/store.js';
import { healthRoutes } from './modules/health.js';
import { authRoutes } from './modules/auth.js';
import { addressRoutes } from './modules/addresses.js';
import { discoveryRoutes } from './modules/discovery.js';
import { cartRoutes } from './modules/cart.js';
import { checkoutRoutes } from './modules/checkout.js';
import { paymentRoutes } from './modules/payments.js';
import { profileRoutes } from './modules/profile.js';
import { contentRoutes } from './modules/content.js';
import { adminRoutes } from './modules/admin.js';
import { ApiError } from './shared/errors.js';

export async function buildApp(): Promise<FastifyInstance> {
  const env = loadEnv();
  const app = Fastify({ logger: false, trustProxy: true, genReqId: () => `req_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}` });
  resetStore();
  await registerSecurity(app, env);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send({
        error: { code: error.code, message: error.message, details: error.details, requestId: request.id },
      });
    }
    if ((error as { validation?: unknown }).validation) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Some details need your attention.', requestId: request.id },
      });
    }
    // Framework and plugin errors (rate limits, oversized bodies) carry
    // their own status. Keep the envelope instead of flattening to 500.
    const httpError = error as { statusCode?: unknown; message?: unknown };
    if (typeof httpError.statusCode === 'number' && httpError.statusCode >= 400 && httpError.statusCode < 600) {
      const limited = httpError.statusCode === 429;
      return reply.status(httpError.statusCode).send({
        error: {
          code: limited ? 'RATE_LIMITED' : 'VALIDATION_ERROR',
          message: limited
            ? 'Too many attempts. Slow down and try again.'
            : typeof httpError.message === 'string'
              ? httpError.message
              : 'Something went wrong. Try again.',
          requestId: request.id,
        },
      });
    }
    request.log?.error?.(error);
    return reply.status(500).send({
      error: { code: 'VALIDATION_ERROR', message: 'Something went wrong. Try again.', requestId: request.id },
    });
  });

  await healthRoutes(app);
  await authRoutes(app, env);
  await addressRoutes(app);
  await discoveryRoutes(app);
  await cartRoutes(app);
  await checkoutRoutes(app);
  await paymentRoutes(app, env);
  await profileRoutes(app);
  await contentRoutes(app);
  await adminRoutes(app);
  return app;
}
