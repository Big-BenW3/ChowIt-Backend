// Applies ./drizzle/*.sql over Neon's SQL-over-HTTPS API. Use this when
// direct Postgres TCP on port 5432 is blocked (restricted networks).
// Same additive-only migration as db:migrate; rollback is 0001_down.sql.
// Usage: npm run db:migrate:http
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

neonConfig.poolQueryViaFetch = true;

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

const client = neon(url);
await migrate(drizzle(client), { migrationsFolder: './drizzle' });
const rows = (await client`
  select table_name from information_schema.tables where table_schema = 'public' order by 1
`) as Array<{ table_name: string }>;
const names = rows.map((r) => r.table_name);
const expected = ['customers', 'orders', 'menu_items', 'payment_attempts', 'idempotency_records'];
// eslint-disable-next-line no-console
console.log(
  JSON.stringify({
    migratedAt: new Date().toISOString(),
    via: 'neon-https',
    tableCount: names.length,
    expectedPresent: expected.every((t) => names.includes(t)),
  }),
);
