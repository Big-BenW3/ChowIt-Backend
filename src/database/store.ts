// In-memory database for V1. priceMenuItem is the single source of truth
// for prices: the client never sends amounts, only item/option/add-on ids.
import { loadSeed } from './seed.js';

export interface Customer {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  passwordHash: string;
  phoneVerifiedAt: string | null;
  referralCode: string;
  createdAt: string;
}

export interface Session {
  id: string;
  customerId: string;
  tokenHash: string;
  expiresAt: number;
  revokedAt: number | null;
}

export interface Address {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string | null;
  landmark: string;
  city: string;
  state: string;
  deliveryInstructions: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  selectedOptionIds: string[];
  addonIds: string[];
  note: string;
}

export interface Cart {
  id: string;
  customerId: string;
  restaurantId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Quote {
  id: string;
  customerId: string;
  addressId: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  serviceFeeKobo: number;
  discountKobo: number;
  totalKobo: number;
  prepEta: number;
  deliveryEta: number;
  expiresAt: number;
  consumed: boolean;
}

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'payment_failed'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  addressSnapshot: Record<string, unknown>;
  status: OrderStatus;
  currency: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  serviceFeeKobo: number;
  discountKobo: number;
  totalKobo: number;
  vendorNote: string;
  gift: { enabled: boolean; recipientName: string; recipientPhone: string; message: string };
  items: Array<Record<string, unknown>>;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  method: string;
  mode: 'mock' | 'live';
  status: 'pending' | 'succeeded' | 'failed';
  amountKobo: number;
  receiptReference: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Db {
  customers: Map<string, Customer>;
  sessions: Map<string, Session>;
  otps: Map<string, { code: string; purpose: string; expiresAt: number; attempts: number }>;
  addresses: Map<string, Address>;
  banners: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  restaurants: Array<Record<string, unknown>>;
  menuCategories: Array<Record<string, unknown>>;
  menuItems: Array<Record<string, unknown>>;
  optionGroups: Array<Record<string, unknown>>;
  options: Array<Record<string, unknown>>;
  addons: Array<Record<string, unknown>>;
  restaurantCategories: Array<{ restaurantId: string; categoryId: string }>;
  carts: Map<string, Cart>;
  quotes: Map<string, Quote>;
  orders: Map<string, Order>;
  orderEvents: Array<{ orderId: string; status: string; message: string; actor: string; createdAt: string }>;
  payments: Map<string, Payment>;
  vouchers: Array<Record<string, unknown>>;
  usedVouchers: Array<{ customerId: string; voucherId: string; orderId: string; redeemedAt: string }>;
  referrals: Array<Record<string, unknown>>;
  giftCards: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  tickets: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  orderSeq: number;
}

function emptyDb(): Db {
  return {
    customers: new Map(),
    sessions: new Map(),
    otps: new Map(),
    addresses: new Map(),
    banners: [],
    categories: [],
    restaurants: [],
    menuCategories: [],
    menuItems: [],
    optionGroups: [],
    options: [],
    addons: [],
    restaurantCategories: [],
    carts: new Map(),
    quotes: new Map(),
    orders: new Map(),
    orderEvents: [],
    payments: new Map(),
    vouchers: [],
    usedVouchers: [],
    referrals: [],
    giftCards: [],
    reviews: [],
    tickets: [],
    notifications: [],
    orderSeq: 1000,
  };
}

export const db: Db = emptyDb();

export function resetStore(): void {
  const fresh = emptyDb();
  const seed = loadSeed();
  const catalogue = seed.catalogue as Record<string, Array<Record<string, unknown>>>;
  fresh.banners = catalogue.banners ?? [];
  fresh.categories = catalogue.categories ?? [];
  fresh.restaurants = catalogue.restaurants ?? [];
  fresh.restaurantCategories = (catalogue.restaurantCategories ?? []) as Array<{ restaurantId: string; categoryId: string }>;
  fresh.menuCategories = catalogue.menuCategories ?? [];
  fresh.menuItems = catalogue.menuItems ?? [];
  fresh.optionGroups = catalogue.optionGroups ?? [];
  fresh.options = catalogue.options ?? [];
  fresh.addons = catalogue.addons ?? [];
  fresh.vouchers = seed.vouchers;
  db.customers = fresh.customers;
  db.sessions = fresh.sessions;
  db.otps = fresh.otps;
  db.addresses = fresh.addresses;
  db.banners = fresh.banners;
  db.categories = fresh.categories;
  db.restaurants = fresh.restaurants;
  db.restaurantCategories = fresh.restaurantCategories;
  db.menuCategories = fresh.menuCategories;
  db.menuItems = fresh.menuItems;
  db.optionGroups = fresh.optionGroups;
  db.options = fresh.options;
  db.addons = fresh.addons;
  db.carts = fresh.carts;
  db.quotes = fresh.quotes;
  db.orders = fresh.orders;
  db.orderEvents = fresh.orderEvents;
  db.payments = fresh.payments;
  db.vouchers = fresh.vouchers;
  db.usedVouchers = fresh.usedVouchers;
  db.referrals = fresh.referrals;
  db.giftCards = fresh.giftCards;
  db.reviews = fresh.reviews;
  db.tickets = fresh.tickets;
  db.notifications = fresh.notifications;
  db.orderSeq = fresh.orderSeq;
}

/** Server-authoritative unit price for a menu item configuration. */
export function priceMenuItem(
  menuItemId: string,
  selectedOptionIds: string[],
  addonIds: string[],
): { unitPrice: number; restaurantId: string; errors: string[] } {
  const errors: string[] = [];
  const item = db.menuItems.find((m) => m.id === menuItemId) as
    | { id: string; restaurantId: string; basePriceKobo: number; isAvailable: boolean }
    | undefined;
  if (!item) return { unitPrice: 0, restaurantId: '', errors: ['Menu item does not exist.'] };
  if (!item.isAvailable) errors.push('This meal is currently unavailable.');
  let unitPrice = item.basePriceKobo;
  for (const optionId of selectedOptionIds) {
    const option = db.options.find((o) => o.id === optionId) as
      | { id: string; groupId: string; priceDeltaKobo: number; isAvailable: boolean }
      | undefined;
    if (!option || !option.isAvailable) {
      errors.push(`Option ${optionId} is not available.`);
      continue;
    }
    unitPrice += option.priceDeltaKobo;
  }
  for (const addonId of addonIds) {
    const addon = db.addons.find((a) => a.id === addonId) as
      | { id: string; menuItemId: string; priceKobo: number; isAvailable: boolean }
      | undefined;
    if (!addon || !addon.isAvailable || addon.menuItemId !== menuItemId) {
      errors.push(`Add-on ${addonId} is not available for this meal.`);
      continue;
    }
    unitPrice += addon.priceKobo;
  }
  return { unitPrice, restaurantId: item.restaurantId, errors };
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((total, line) => {
    const priced = priceMenuItem(line.menuItemId, line.selectedOptionIds, line.addonIds);
    return total + priced.unitPrice * line.quantity;
  }, 0);
}
