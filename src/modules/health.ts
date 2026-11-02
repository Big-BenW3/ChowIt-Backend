import type { FastifyInstance } from 'fastify';
import { envelope } from '../shared/context.js';
import { db } from '../database/store.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async () => {
    void db;
    return envelope({ ready: true });
  });
}
