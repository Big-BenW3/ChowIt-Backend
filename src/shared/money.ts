// Money is always integer kobo (₦1 = 100). Floats are banned here because
// 0.1 + 0.2 !== 0.3 would silently misprice orders.
export const KOBO_PER_NAIRA = 100;

export function formatNgn(kobo: number): string {
  const naira = Math.floor(kobo / KOBO_PER_NAIRA);
  return `\u20A6${naira.toLocaleString('en-NG')}`;
}

export function sumKobo(lines: number[]): number {
  return lines.reduce((total, line) => total + line, 0);
}

export function assertKobo(value: number, field = 'amount'): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${field}: must be integer kobo >= 0`);
  }
}
