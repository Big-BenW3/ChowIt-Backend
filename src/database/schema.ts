// ChowIt Postgres schema (Drizzle): the durable twin of the in-memory
// store. All money is integer kobo; customers/orders/payments reference
// each other with foreign keys, and idempotency has a unique triple.
// Generate SQL with `npm run db:generate`, apply with `npm run db:migrate`.
// Generate SQL with `npm run db:generate`, apply with `npm run db:migrate`.
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

const tz = (name?: string) =>
  name ? timestamp(name, { withTimezone: true }) : timestamp({ withTimezone: true });
const createdAt = () => tz().defaultNow().notNull();

export const customers = pgTable('customers', {
  id: text().primaryKey(),
  fullName: text('full_name').notNull(),
  username: text().notNull().unique(),
  phoneE164: text('phone_e164').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phoneVerifiedAt: tz('phone_verified_at'),
  avatarKey: text('avatar_key'),
  referralCode: text('referral_code').notNull(),
  createdAt: createdAt(),
});

export const customerSessions = pgTable(
  'customer_sessions',
  {
    id: text().primaryKey(),
    customerId: text('customer_id').notNull().references(() => customers.id),
    tokenHash: text('token_hash').notNull().unique(),
    deviceLabel: text('device_label'),
    expiresAt: tz('expires_at').notNull(),
    revokedAt: tz('revoked_at'),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_customer_idx').on(t.customerId)],
);

export const phoneVerificationCodes = pgTable('phone_verification_codes', {
  id: text().primaryKey(),
  phone: text().notNull(),
  codeHash: text('code_hash').notNull(),
  purpose: text().notNull(),
  expiresAt: tz('expires_at').notNull(),
  consumedAt: tz('consumed_at'),
  attemptCount: integer('attempt_count').notNull().default(0),
});

export const addresses = pgTable(
  'addresses',
  {
    id: text().primaryKey(),
    customerId: text('customer_id').notNull().references(() => customers.id),
    label: text().notNull().default('Home'),
    recipientName: text('recipient_name').notNull(),
    recipientPhone: text('recipient_phone').notNull(),
    line1: text().notNull(),
    line2: text(),
    landmark: text().notNull().default(''),
    city: text().notNull().default('Onitsha'),
    state: text().notNull().default('Anambra'),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    instructions: text().notNull().default(''),
    isDefault: boolean('is_default').notNull().default(false),
  },
  (t) => [index('addresses_customer_idx').on(t.customerId)],
);

export const banners = pgTable('banners', {
  id: text().primaryKey(),
  title: text().notNull(),
  subtitle: text().notNull().default(''),
  imageUrl: text('image_url').notNull(),
  deepLinkType: text('deep_link_type').notNull().default(''),
  deepLinkId: text('deep_link_id').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  activeFrom: tz('active_from'),
  activeTo: tz('active_to'),
});

export const categories = pgTable('categories', {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  iconUrl: text('icon_url').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const restaurants = pgTable('restaurants', {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text().notNull().default(''),
  logoUrl: text('logo_url').notNull().default(''),
  coverUrl: text('cover_url').notNull().default(''),
  rating: doublePrecision().notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  prepMinMinutes: integer('prep_min_minutes').notNull().default(15),
  prepMaxMinutes: integer('prep_max_minutes').notNull().default(30),
  minimumOrderKobo: integer('minimum_order_kobo').notNull().default(0),
  deliveryFeeKobo: integer('delivery_fee_kobo').notNull().default(100000),
  isOpen: boolean('is_open').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  city: text().notNull().default(''),
});

export const restaurantHours = pgTable('restaurant_hours', {
  id: text().primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  weekday: integer().notNull(),
  openTime: text('open_time').notNull(),
  closeTime: text('close_time').notNull(),
  isClosed: boolean('is_closed').notNull().default(false),
});

export const restaurantCategories = pgTable(
  'restaurant_categories',
  {
    restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
    categoryId: text('category_id').notNull().references(() => categories.id),
  },
  (t) => [uniqueIndex('restaurant_category_unique').on(t.restaurantId, t.categoryId)],
);

export const menuCategories = pgTable('menu_categories', {
  id: text().primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  name: text().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: text().primaryKey(),
    restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
    menuCategoryId: text('menu_category_id').references(() => menuCategories.id),
    name: text().notNull(),
    description: text().notNull().default(''),
    imageUrl: text('image_url').notNull().default(''),
    basePriceKobo: integer('base_price_kobo').notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('menu_items_restaurant_idx').on(t.restaurantId)],
);

export const menuOptionGroups = pgTable('menu_option_groups', {
  id: text().primaryKey(),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  name: text().notNull(),
  required: boolean().notNull().default(false),
  minSelect: integer('min_select').notNull().default(0),
  maxSelect: integer('max_select').notNull().default(1),
});

export const menuOptions = pgTable('menu_options', {
  id: text().primaryKey(),
  optionGroupId: text('group_id').notNull().references(() => menuOptionGroups.id),
  name: text().notNull(),
  priceDeltaKobo: integer('price_delta_kobo').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
});

export const menuAddons = pgTable('menu_addons', {
  id: text().primaryKey(),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  name: text().notNull(),
  priceKobo: integer('price_kobo').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
});

export const carts = pgTable('carts', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().unique().references(() => customers.id),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  updatedAt: tz('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable(
  'cart_items',
  {
    id: text().primaryKey(),
    cartId: text('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
    menuItemId: text('menu_item_id').references(() => menuItems.id),
    quantity: integer().notNull().default(1),
    selectedOptions: jsonb('selected_options').notNull().default([]),
    note: text().notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('cart_items_cart_idx').on(t.cartId)],
);

export const checkoutQuotes = pgTable('checkout_quotes', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  cartId: text('cart_id').references(() => carts.id),
  addressId: text('address_id').references(() => addresses.id),
  subtotalKobo: integer('subtotal_kobo').notNull(),
  deliveryFeeKobo: integer('delivery_fee_kobo').notNull(),
  serviceFeeKobo: integer('service_fee_kobo').notNull().default(0),
  discountKobo: integer('discount_kobo').notNull().default(0),
  totalKobo: integer('total_kobo').notNull(),
  quoteSnapshot: jsonb('quote_snapshot').notNull().default({}),
  expiresAt: tz('expires_at').notNull(),
  consumed: boolean().notNull().default(false),
});

export const orders = pgTable(
  'orders',
  {
    id: text().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    customerId: text('customer_id').notNull().references(() => customers.id),
    restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
    addressSnapshot: jsonb('address_snapshot').notNull(),
    status: text().notNull().default('pending_payment'),
    currency: text().notNull().default('NGN'),
    subtotalKobo: integer('subtotal_kobo').notNull(),
    deliveryFeeKobo: integer('delivery_fee_kobo').notNull(),
    serviceFeeKobo: integer('service_fee_kobo').notNull().default(0),
    discountKobo: integer('discount_kobo').notNull().default(0),
    totalKobo: integer('total_kobo').notNull(),
    vendorNote: text('vendor_note').notNull().default(''),
    gift: jsonb().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index('orders_customer_idx').on(t.customerId)],
);

export const orderItems = pgTable('order_items', {
  id: text().primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').references(() => menuItems.id),
  itemNameSnapshot: text('item_name_snapshot').notNull(),
  optionSnapshot: jsonb('option_snapshot').notNull().default({}),
  quantity: integer().notNull(),
  note: text().notNull().default(''),
  unitPriceKobo: integer('unit_price_kobo').notNull(),
  lineTotalKobo: integer('line_total_kobo').notNull(),
});

export const orderStatusEvents = pgTable(
  'order_status_events',
  {
    id: text().primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    status: text().notNull(),
    message: text().notNull().default(''),
    actorType: text('actor_type').notNull().default('system'),
    actorId: text('actor_id'),
    createdAt: createdAt(),
  },
  (t) => [index('status_events_order_idx').on(t.orderId)],
);

export const paymentAttempts = pgTable('payment_attempts', {
  id: text().primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  method: text().notNull(),
  mode: text().notNull().default('mock'),
  status: text().notNull().default('pending'),
  amountKobo: integer('amount_kobo').notNull(),
  currency: text().notNull().default('NGN'),
  providerReference: text('provider_reference'),
  createdAt: createdAt(),
  completedAt: tz('completed_at'),
});

export const vouchers = pgTable('vouchers', {
  id: text().primaryKey(),
  code: text().notNull().unique(),
  description: text().notNull().default(''),
  discountType: text('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  minimumOrderKobo: integer('minimum_order_kobo').notNull().default(0),
  maxDiscountKobo: integer('max_discount_kobo').notNull().default(0),
  startsAt: tz('starts_at'),
  expiresAt: tz('expires_at'),
  usageLimit: integer('usage_limit'),
  active: boolean().notNull().default(true),
});

export const customerVouchers = pgTable('customer_vouchers', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  voucherId: text('voucher_id').notNull().references(() => vouchers.id),
  redeemedAt: tz('redeemed_at'),
  orderId: text('order_id').references(() => orders.id),
});

export const referrals = pgTable('referrals', {
  id: text().primaryKey(),
  referrerCustomerId: text('referrer_customer_id').references(() => customers.id),
  referredCustomerId: text('referred_customer_id').references(() => customers.id),
  referralCode: text('referral_code').notNull(),
  status: text().notNull().default('pending'),
  rewardState: text('reward_state').notNull().default('none'),
  createdAt: createdAt(),
});

export const giftCards = pgTable('gift_cards', {
  id: text().primaryKey(),
  ownerCustomerId: text('owner_customer_id').references(() => customers.id),
  recipientName: text('recipient_name').notNull().default(''),
  recipientPhone: text('recipient_phone').notNull().default(''),
  codeHash: text('code_hash').notNull(),
  balanceKobo: integer('balance_kobo').notNull().default(0),
  status: text().notNull().default('active'),
  expiresAt: tz('expires_at'),
});

export const walletEntries = pgTable('wallet_entries', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  entryType: text('entry_type').notNull(),
  amountKobo: integer('amount_kobo').notNull(),
  reference: text().notNull().default(''),
  description: text().notNull().default(''),
  createdAt: createdAt(),
});

export const reviews = pgTable('reviews', {
  id: text().primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  rating: integer().notNull(),
  comment: text().notNull().default(''),
  createdAt: createdAt(),
});

export const supportTickets = pgTable('support_tickets', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  orderId: text('order_id').references(() => orders.id),
  topic: text().notNull(),
  message: text().notNull(),
  status: text().notNull().default('open'),
  createdAt: createdAt(),
});

export const notifications = pgTable(
  'notifications',
  {
    id: text().primaryKey(),
    customerId: text('customer_id').notNull().references(() => customers.id),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull().default(''),
    readAt: tz('read_at'),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_customer_idx').on(t.customerId)],
);

export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: text().primaryKey(),
    customerId: text('customer_id').notNull(),
    routeKey: text('route_key').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    requestHash: text('request_hash').notNull(),
    responseJson: jsonb('response_json'),
    createdAt: createdAt(),
    expiresAt: tz('expires_at'),
  },
  (t) => [uniqueIndex('idempotency_unique').on(t.customerId, t.routeKey, t.idempotencyKey)],
);
