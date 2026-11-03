# ChowIt API

Fastify + TypeScript service for the ChowIt customer product. The codebase is organized as a modular monolith with mock payment behavior for demo flows, structured validation, and a seeded in-memory store that can be swapped for Postgres-backed persistence.

## What this backend does

This API powers the customer journey for ChowIt:

- account creation and OTP sign-in
- saved addresses and delivery coverage
- restaurant discovery, search, and menus
- cart management and quoted checkout totals
- order creation and lifecycle tracking
- mock payment attempts and receipts
- vouchers, gift cards, referral data, and content
- admin operations for order status and menu availability

The service is intentionally built for a demo environment with `PAYMENT_MODE=mock` by default. In mock mode the app exposes a demo payment label instead of making real money movements.

## Stack

- Node.js 24
- TypeScript
- Fastify 5
- Drizzle ORM + Neon Postgres support
- Vitest for API tests
- Argon2id password hashing
- TypeBox schema validation

## Architecture

The application is split into a small set of clear layers:

- `src/app.ts` — creates the Fastify app, registers security plugins, installs route modules, and defines the shared error envelope.
- `src/server.ts` — boots the app and binds it to the configured port.
- `src/config/env.ts` — loads environment variables and validates required runtime settings.
- `src/plugins/security.ts` — configures Helmet, CORS, rate limits, and OpenAPI docs.
- `src/database/store.ts` — stores the live data model and is seeded from the catalog definitions.
- `src/database/seed.ts` — creates the demo catalogue used for discovery, pricing, and content.
- `src/modules/` — feature routes for auth, profile, discovery, cart, checkout, payments, content, and admin.
- `src/shared/` — reusable auth, money, validation, sanitization, errors, and idempotency helpers.

## Feature areas

### Auth and profiles

- customer registration and phone verification
- OTP resend and login
- password reset flow
- current customer session lookup
- preferences, referrals, wallet summary, gift-card state, and vouchers

### Discovery and ordering

- home feed with banners and category data
- restaurant listing, filtering, and detail views
- menu items with option groups and add-ons
- search and recommendations
- cart pricing and order quote generation

### Checkout and payments

- server-side quote calculation with subtotal, delivery fee, discount, and total
- order creation from quote
- payment-attempt tracking with mock completion route
- idempotency keys to prevent duplicate order/payment writes

### Content and support

- FAQ content and legal pages
- support ticket creation and retrieval
- notifications and push token registration
- staff/admin operations for status changes and menu availability

## Project layout

```text
BACKEND/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── database/
│   ├── modules/
│   ├── plugins/
│   └── shared/
├── test/
├── drizzle/
├── docs/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── drizzle.config.ts
├── vitest.config.ts
├── render.yaml
├── README.md
└── .env.example
```

## Local setup

From `BACKEND/`:

```bash
npm ci
cp .env.example .env
npm run dev
```

By default the app runs on:

- `http://localhost:4000`
- Swagger docs at `http://localhost:4000/docs`

## Required environment variables

Create a `.env` file with at least:

```bash
DATABASE_URL=postgresql://...
OTP_CODE=123456
PAYMENT_MODE=mock
SESSION_TTL_HOURS=168
API_CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

Runtime notes:

- `OTP_CODE` is required in production and the server refuses to start without it.
- `PAYMENT_MODE` supports `mock` and `live`.
- `API_CORS_ORIGINS` should be a comma-separated allowlist.

## Scripts

```bash
npm run dev            # start the API in dev mode
npm run build          # compile TypeScript to dist/
npm run start          # run compiled server
npm run lint           # type-check the project
npm test               # run Vitest suite
npm run seed           # print the demo-data summary used for DB population
npm run db:generate    # generate Drizzle SQL from schema
npm run db:migrate     # apply pending migrations to DATABASE_URL
npm run db:migrate:http # apply migrations through Neon's HTTPS API
```

## Database and migrations

This project is designed to work with Neon Postgres, but it also supports a local in-memory store for the demo catalogue.

The first migration in `drizzle/0000_*` is additive only. It creates tables and indexes without destructive changes. The rollback SQL file (`drizzle/0000_down.sql`) drops the V1 tables and should only be used when the data is disposable.

Important behavior:

- migrations are explicit and separate from seeding
- seeding is not triggered automatically by migration
- `npm run seed` prints the catalogue shape that can be moved into a real database population step

## Deployment

The repository includes a Render Blueprint in `render.yaml`.

Default deployment behavior:

- build: `npm ci && npm run build`
- migrate: `npm run db:migrate`
- start: `npm start`
- health checks target `GET /health/live`

The Render dashboard should set the same environment values listed above, especially `DATABASE_URL`, `OTP_CODE`, `API_CORS_ORIGINS`, `PAYMENT_MODE`, and `SESSION_TTL_HOURS`.

## Security notes

The backend includes several guardrails for a customer API:

- Argon2id password hashing
- opaque session tokens stored as SHA-256 hashes
- bearer-auth checks for protected routes
- ownership validation before mutating customer-owned resources
- schema validation and sanitization on inbound data
- explicit CORS origins and rate limits
- idempotency keys for write-heavy endpoints
- consistent structured error payloads with request IDs

## API documentation

More detail is available in:

- `docs/API_ENDPOINTS.md` — route-by-route endpoint reference
- `docs/V1_FEATURES.md` — feature scope and product assumptions
- `docs/v2/` — follow-up version notes for dark mode, biometric auth, favorites, wallet, payments, OTP, and push notifications

## Status

This repo is a working V1 backend for a food-ordering app demo, with mock payments enabled by default and a modular structure ready for a real persistence layer or production payment provider.
