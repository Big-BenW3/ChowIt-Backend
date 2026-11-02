// Money is always integer kobo. Never use floats for money.
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
