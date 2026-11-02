import type { FastifyInstance } from 'fastify';

export async function registerLoginAndAddress(
  app: FastifyInstance,
  tag: string,
): Promise<{ token: string; addressId: string }> {
  const phone = `+23480${String(1000000 + Math.floor(Math.random() * 8999999))}`;
  const username = `user_${tag}_${Date.now().toString(36)}`.toLowerCase();
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { phone, fullName: 'Test User', username, password: 'password123' } });
  await app.inject({ method: 'POST', url: '/api/v1/auth/verify-phone', payload: { phone, code: process.env.OTP_CODE ?? '123456' } });
  const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone, password: 'password123' } });
  const token = login.json().data.token as string;
  const address = await app.inject({
    method: 'POST', url: '/api/v1/addresses',
    headers: { authorization: `Bearer ${token}` },
    payload: { label: 'Home', recipientName: 'Test User', recipientPhone: phone, line1: '12 Example Street', landmark: 'Junction', city: 'Onitsha', state: 'Anambra' },
  });
  return { token, addressId: (address.json().data as { id: string }).id };
}
