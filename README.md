# ChowIt API (V1)

Fastify 5 + TypeScript modular monolith for the ChowIt customer app.
Payments are mocked: the app shows a demo label and no money moves.

## Layout

- `src/app.ts` — builds the Fastify instance and registers modules.
- `src/server.ts` — listens on `PORT`.
- `src/config/env.ts` — environment loading (`PAYMENT_MODE=mock|live`).
- `src/plugins/security.ts` — helmet, CORS, rate limits, OpenAPI docs.
- `src/shared/` — errors, sanitisation, money (integer kobo), sessions, idempotency.
- `src/database/seed.ts` — demo catalogue: 4 banners, 10 categories,
  10 restaurants, 40 menu items with options/add-ons, vouchers, FAQs, legal.
- `src/database/store.ts` — in-memory store seeded from `seed.ts`.
  Swap the repository functions for Drizzle/PostgreSQL without changing routes.
- `src/modules/` — health, auth, addresses, discovery, cart, checkout,
  payments, profile, content, admin.
- `test/` — maintained Vitest suite (auth, cart, checkout, payments).

## Run

```sh
npm ci
npm run dev      # http://localhost:4000, docs at /docs
npm test
npm run seed     # prints the demo-data summary used for DB population
```

## Database (Neon Postgres)

```sh
npm run db:generate      # regenerate ./drizzle/*.sql from src/database/schema.ts
npm run db:migrate       # apply pending SQL to DATABASE_URL from .env
npm run db:migrate:http  # same migration over Neon's HTTPS API (restricted networks)
```

The first migration is additive only (CREATE TABLE / INDEX, no drops or
rewrites), so it is safe to run against a fresh database. Rollback is
`drizzle/0000_down.sql`, which drops the V1 tables; run it only when there
is no data to keep. Seeding is a separate explicit step (`npm run seed`
prints the catalogue; inserting it is not done by migrate).

Copy `.env.example` to `.env` and set `PAYMENT_MODE=mock` for the demo.
In live mode the mock-complete route returns `MOCK_PAYMENT_DISABLED`.

## Security notes

- Argon2id password hashes, opaque sessions stored as SHA-256 hashes.
- Bearer auth on customer routes, ownership checks on every resource.
- JSON Schema validation, string sanitisation, explicit CORS origins.
- Rate limits on auth/OTP/search; idempotency keys on orders and payments.
- Structured error envelope; no hashes or tokens leak in responses.
