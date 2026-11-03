// Production entrypoint: binds 0.0.0.0:$PORT from the environment.
// Render injects PORT and probes /health/live.
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await buildApp();
await app.listen({ port: env.port, host: env.host });
// eslint-disable-next-line no-console
console.log(`ChowIt API listening on http://${env.host}:${env.port} (${env.appEnv}, payment=${env.paymentMode})`);
