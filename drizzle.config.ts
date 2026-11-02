import { defineConfig } from 'drizzle-kit';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function envUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const path = join(process.cwd(), '.env');
  if (!existsSync(path)) return '';
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"#\n]+)"?\s*$/);
    if (match) return match[1].trim();
  }
  return '';
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: { url: envUrl() },
});
