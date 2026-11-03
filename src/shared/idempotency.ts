// In-memory idempotency journal (24h TTL). Same key + same payload replays
// the original response; same key + different payload is a 409 conflict.
// This is what makes order/payment retries safe after network timeouts.
export interface IdempotencyRecord {
  response: unknown;
  requestHash: string;
  createdAt: number;
}

const records = new Map<string, IdempotencyRecord>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function idemKey(customerId: string, routeKey: string, key: string): string {
  return `${customerId}:${routeKey}:${key}`;
}

export function hashRequest(payload: unknown): string {
  return JSON.stringify(payload ?? null);
}

export function getIdem(key: string): IdempotencyRecord | undefined {
  const record = records.get(key);
  if (!record) return undefined;
  if (Date.now() - record.createdAt > TTL_MS) {
    records.delete(key);
    return undefined;
  }
  return record;
}

export function setIdem(key: string, requestHash: string, response: unknown): void {
  records.set(key, { response, requestHash, createdAt: Date.now() });
}

export function clearIdem(): void {
  records.clear();
}
