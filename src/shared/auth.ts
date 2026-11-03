// Passwords use Argon2id; sessions are opaque random tokens stored only
// as SHA-256 hashes, so a database leak reveals neither passwords nor
// usable session tokens.
import { hash, verify } from '@node-rs/argon2';
import { randomBytes, createHash } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

export function newSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}
