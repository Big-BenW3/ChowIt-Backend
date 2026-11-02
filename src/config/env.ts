export interface Env {
  port: number;
  host: string;
  appEnv: string;
  corsOrigins: string[];
  paymentMode: 'mock' | 'live';
  otpCode: string;
  sessionTtlHours: number;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEnv(): Env {
  const origins = (process.env.API_CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    port: num(process.env.PORT, 4000),
    host: process.env.HOST ?? '0.0.0.0',
    appEnv: process.env.APP_ENV ?? 'development',
    corsOrigins: origins,
    paymentMode: process.env.PAYMENT_MODE === 'live' ? 'live' : 'mock',
    otpCode: process.env.OTP_CODE ?? '123456',
    sessionTtlHours: num(process.env.SESSION_TTL_HOURS, 720),
  };
}
