// Central security wiring: HTTP headers, CORS allow-list, global rate
// limits, and generated API docs. Per-route stricter limits live with the
// auth routes that need brute-force protection.
import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { Env } from '../config/env.js';

export async function registerSecurity(app: FastifyInstance, env: Env): Promise<void> {
  // Helmet defaults: HSTS (HTTPS only), no-sniff, frame deny, strict
  // referrer policy. CSP stays off: this API serves JSON, not pages.
  await app.register(helmet, { contentSecurityPolicy: false });
  // No origins configured means no browser access at all. Mobile apps are
  // unaffected by CORS; this only matters if a web client is added.
  await app.register(cors, {
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : false,
    credentials: true,
  });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(swagger, {
    openapi: {
      info: { title: 'ChowIt API', version: '0.1.0' },
    },
  });
  // Interactive docs stay a development tool. In production the schema
  // would hand attackers a free map of every endpoint.
  if (env.appEnv !== 'production') {
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }
}

/** Tight limits for brute-force targets (10–20 requests/minute per IP). */
export const authRateLimit = { max: 20, timeWindow: '1 minute' };
export const otpRateLimit = { max: 10, timeWindow: '1 minute' };
