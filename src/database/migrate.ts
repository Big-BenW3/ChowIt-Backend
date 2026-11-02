// Applies ./drizzle/*.sql to the Neon database. Additive only: it creates
// tables and indexes, never drops or alters existing columns.
// Rollback: run ./drizzle/0001_down.sql (drops the V1 tables).
// Usage: npm run db:migrate
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

function loadEnv(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#\n]+)"?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  }
}

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
loadEnv(join(root, '.env'));

const url = process.env.DATABASE_URL ?? '';
if (!url) {
  // eslint-disable-next-line no-console
  console.error('DATABASE_URL is missing. Copy .env.example to .env first.');
  process.exit(1);
}

const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: './drizzle' });
// eslint-disable-next-line no-console
console.log(JSON.stringify({ migratedAt: new Date().toISOString(), folder: './drizzle' }));
await client.end();
