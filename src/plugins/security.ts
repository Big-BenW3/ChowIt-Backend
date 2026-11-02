import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { Env } from '../config/env.js';

export async function registerSecurity(app: FastifyInstance, env: Env): Promise<void> {
  await app.register(helmet, { contentSecurityPolicy: false });
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
  await app.register(swaggerUi, { routePrefix: '/docs' });
}
