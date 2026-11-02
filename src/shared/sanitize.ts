// Input sanitisation helpers. Every route trims strings and strips
// control/HTML content before validation or storage.

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG = /<[^>]*>/g;

export function cleanText(value: unknown, maxLen = 280): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAG, '')
    .trim()
    .slice(0, maxLen);
}

export function cleanPhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/[\s\-().]/g, '');
  return trimmed.slice(0, 20);
}

/** Normalise to E.164-ish form. Defaults Nigerian numbers to +234. */
export function normalizePhone(raw: string): string | null {
  let phone = cleanPhone(raw);
  if (!phone) return null;
  if (phone.startsWith('0')) phone = '+234' + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+' + phone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  return phone;
}

export function normalizeUsername(raw: string): string {
  return cleanText(raw, 32).toLowerCase().replace(/[^a-z0-9_.]/g, '');
}

export function toKobo(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}
