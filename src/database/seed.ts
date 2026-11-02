// ChowIt demo seed catalogue. All money is integer kobo (₦1 = 100 kobo).
// Images use deterministic picsum seeds so the demo renders without
// committing third-party photos. Replace with licensed photos later.

export interface SeedResult {
  catalogue: Record<string, Array<Record<string, unknown>>>;
  vouchers: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  legal: Array<Record<string, unknown>>;
}

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/800/600`;

const BANNERS = [
  { id: 'banner_1', title: 'Weekend Jollof Fest', subtitle: 'Up to 20% off party rice', imageUrl: img('chowit-banner-jollof'), deepLinkType: 'category', deepLinkId: 'cat_rice', sortOrder: 1 },
  { id: 'banner_2', title: 'Suya nights', subtitle: 'Grills from ₦1,500', imageUrl: img('chowit-banner-suya'), deepLinkType: 'restaurant', deepLinkId: 'rest_suyapalace', sortOrder: 2 },
  { id: 'banner_3', title: 'New here? Welcome ₦200 off', subtitle: 'Use code WELCOME200', imageUrl: img('chowit-banner-welcome'), deepLinkType: 'voucher', deepLinkId: 'WELCOME200', sortOrder: 3 },
  { id: 'banner_4', title: 'Pastries by 8am', subtitle: 'Fresh from Chops & Rolls', imageUrl: img('chowit-banner-pastry'), deepLinkType: 'restaurant', deepLinkId: 'rest_chopsrolls', sortOrder: 4 },
];

const CATEGORIES = [
  { id: 'cat_local', name: 'Local dishes', slug: 'local-dishes', iconUrl: img('chowit-icon-local'), sortOrder: 1, isActive: true },
  { id: 'cat_fastfood', name: 'Fast food', slug: 'fast-food', iconUrl: img('chowit-icon-fastfood'), sortOrder: 2, isActive: true },
  { id: 'cat_pastry', name: 'Pastries', slug: 'pastries', iconUrl: img('chowit-icon-pastry'), sortOrder: 3, isActive: true },
  { id: 'cat_rice', name: 'Rice & bowls', slug: 'rice-bowls', iconUrl: img('chowit-icon-rice'), sortOrder: 4, isActive: true },
  { id: 'cat_grills', name: 'Grills', slug: 'grills', iconUrl: img('chowit-icon-grills'), sortOrder: 5, isActive: true },
  { id: 'cat_snacks', name: 'Snacks', slug: 'snacks', iconUrl: img('chowit-icon-snacks'), sortOrder: 6, isActive: true },
  { id: 'cat_drinks', name: 'Drinks', slug: 'drinks', iconUrl: img('chowit-icon-drinks'), sortOrder: 7, isActive: true },
  { id: 'cat_breakfast', name: 'Breakfast', slug: 'breakfast', iconUrl: img('chowit-icon-breakfast'), sortOrder: 8, isActive: true },
  { id: 'cat_dessert', name: 'Desserts', slug: 'desserts', iconUrl: img('chowit-icon-dessert'), sortOrder: 9, isActive: true },
  { id: 'cat_healthy', name: 'Healthy', slug: 'healthy', iconUrl: img('chowit-icon-healthy'), sortOrder: 10, isActive: true },
];

interface RestaurantSpec {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  prepMin: number;
  prepMax: number;
  minOrder: number;
  categories: string[];
}

const RESTAURANTS: RestaurantSpec[] = [
  { id: 'rest_mamankechi', name: 'Mama Nkechi Kitchen', city: 'Onitsha', rating: 4.8, reviews: 1240, prepMin: 20, prepMax: 35, minOrder: 150000, categories: ['cat_local', 'cat_rice'] },
  { id: 'rest_jollofrepublic', name: 'Jollof Republic', city: 'Awka', rating: 4.6, reviews: 860, prepMin: 15, prepMax: 30, minOrder: 100000, categories: ['cat_rice', 'cat_fastfood'] },
  { id: 'rest_suyapalace', name: 'Suya Palace', city: 'Onitsha', rating: 4.7, reviews: 2100, prepMin: 10, prepMax: 25, minOrder: 150000, categories: ['cat_grills', 'cat_snacks'] },
  { id: 'rest_crispycrown', name: 'Crispy Crown', city: 'Nnewi', rating: 4.4, reviews: 530, prepMin: 10, prepMax: 20, minOrder: 100000, categories: ['cat_fastfood', 'cat_snacks'] },
  { id: 'rest_plantainhouse', name: 'Plantain House', city: 'Asaba', rating: 4.5, reviews: 410, prepMin: 10, prepMax: 20, minOrder: 50000, categories: ['cat_snacks', 'cat_breakfast'] },
  { id: 'rest_nkwobicorner', name: 'Nkwobi Corner', city: 'Enugu', rating: 4.9, reviews: 980, prepMin: 15, prepMax: 30, minOrder: 200000, categories: ['cat_local', 'cat_grills'] },
  { id: 'rest_shawarmalab', name: 'Shawarma Lab', city: 'Onitsha', rating: 4.3, reviews: 720, prepMin: 10, prepMax: 20, minOrder: 100000, categories: ['cat_fastfood', 'cat_snacks'] },
  { id: 'rest_ofadacentral', name: 'Ofada Central', city: 'Lagos', rating: 4.6, reviews: 650, prepMin: 20, prepMax: 35, minOrder: 150000, categories: ['cat_rice', 'cat_local'] },
  { id: 'rest_chopsrolls', name: 'Chops & Rolls', city: 'Awka', rating: 4.5, reviews: 390, prepMin: 5, prepMax: 15, minOrder: 50000, categories: ['cat_pastry', 'cat_breakfast', 'cat_dessert'] },
  { id: 'rest_smoothiefarm', name: 'Smoothie Farm', city: 'Onitsha', rating: 4.7, reviews: 280, prepMin: 5, prepMax: 15, minOrder: 50000, categories: ['cat_drinks', 'cat_healthy', 'cat_dessert'] },
];

// price_kobo, customisable, available
type ItemSpec = [string, string, number, boolean, boolean];

const MENU: Record<string, ItemSpec[]> = {
  rest_mamankechi: [
    ['Ofe nsala & pounded yam', 'White soup with yam, garnished with utazi.', 350000, true, true],
    ['Bitter-leaf soup & eba', 'Washed bitter leaf with assorted meat.', 300000, true, true],
    ['Oha soup & fufu', 'Cocoyam-thickened oha with stockfish.', 320000, true, true],
    ['Abacha (African salad)', 'Cassava flakes with ugba and palm oil dressing.', 180000, false, true],
  ],
  rest_jollofrepublic: [
    ['Party jollof rice', 'Smoky firewood jollof with fried plantain.', 250000, true, true],
    ['Native jollof (palm-oil rice)', 'Village-style rice with smoked fish.', 280000, true, true],
    ['Fried rice & chicken', 'Golden fried rice with crispy chicken.', 270000, true, true],
    ['Jollof & turkey combo', 'Party jollof with grilled turkey wing.', 380000, true, true],
  ],
  rest_suyapalace: [
    ['Beef suya (full)', 'Flame-grilled beef with yaji spice and onions.', 220000, true, true],
    ['Chicken suya', 'Charcoal chicken suya with fresh cabbage.', 250000, true, true],
    ['Gizzard suya', 'Spicy grilled gizzard, street style.', 200000, false, true],
    ['Suya platter for two', 'Beef, chicken and gizzard with fries.', 550000, true, true],
  ],
  rest_crispycrown: [
    ['Crispy chicken bucket (5pc)', 'Crunchy fried chicken with fries.', 450000, false, true],
    ['Chicken burger & fries', 'Toasted bun, slaw and pepper mayo.', 280000, true, true],
    ['Fish fillet & chips', 'Battered hake with tartar dip.', 320000, false, true],
    ['Wings platter (8pc)', 'Tossed in sweet-heat glaze.', 360000, true, true],
  ],
  rest_plantainhouse: [
    ['Boli & groundnut', 'Roasted plantain with roasted peanuts.', 120000, false, true],
    ['Boli & peppered sauce', 'Roasted plantain with hot fish sauce.', 150000, false, true],
    ['Plantain & egg sauce', 'Fried plantain with rich egg stew.', 180000, false, true],
    ['Gizdodo', 'Plantain cubes tossed with gizzard.', 250000, false, true],
  ],
  rest_nkwobicorner: [
    ['Nkwobi (cow foot)', 'Palm-oil nkwobi with ugba, served hot.', 350000, false, true],
    ['Isi ewu (goat head)', 'Slow-cooked isi ewu with native spice.', 450000, false, true],
    ['Peppered snail (6pc)', 'Crunchy snails in peppered sauce.', 500000, false, true],
    ['Nkwobi & isi ewu combo', 'Half portions of both house signatures.', 600000, false, false],
  ],
  rest_shawarmalab: [
    ['Chicken shawarma (regular)', 'Garlic cream, cabbage and fries inside.', 180000, true, true],
    ['Beef shawarma (large)', 'Double beef with cheese and sauced fries.', 280000, true, true],
    ['Mixed-grill shawarma', 'Chicken, beef and sausage tower.', 320000, true, true],
    ['Shawarma & smoothie deal', 'Regular shawarma with a 50cl smoothie.', 300000, false, true],
  ],
  rest_ofadacentral: [
    ['Ofada rice & ayamase', 'Local rice with green pepper sauce.', 300000, true, true],
    ['Ofada & assorted meat', 'Ayamase with beef, pomo and egg.', 420000, true, true],
    ['Frying-pan ofada (serves 2)', 'Family ofada bowl with extras.', 750000, true, true],
    ['Ayamase sauce only (500ml)', 'Take-home green pepper sauce.', 250000, false, true],
  ],
  rest_chopsrolls: [
    ['Meat pie', 'Flaky crust with minced beef filling.', 80000, false, true],
    ['Chicken pie', 'Creamy chicken and potato filling.', 100000, false, true],
    ['Puff puff (5pc)', 'Golden, pillowy and lightly sweet.', 50000, false, true],
    ['Sausage roll & doughnut box', 'Party box of six mixed pastries.', 150000, false, true],
  ],
  rest_smoothiefarm: [
    ['Mango-passion smoothie (50cl)', 'Mango, passion fruit and yoghurt.', 150000, false, true],
    ['Banana-oat breakfast cup', 'Blended banana, oats and honey.', 120000, false, true],
    ['Zobo & ginger cooler', 'Chilled hibiscus with fresh ginger.', 80000, false, true],
    ['Detox green juice', 'Cucumber, pineapple and mint.', 140000, false, true],
  ],
};

const MENU_CATEGORY_NAMES = ['Mains', 'Sides', 'Drinks', 'Specials'];

const VOUCHERS = [
  { id: 'voucher_chowit10', code: 'CHOWIT10', description: '10% off orders above ₦5,000', discountType: 'percent', discountValue: 10, minimumOrderKobo: 500000, maxDiscountKobo: 100000, startsAt: '2026-01-01', expiresAt: '2027-01-01', usageLimit: 1000, active: true },
  { id: 'voucher_welcome200', code: 'WELCOME200', description: '₦200 off your first order', discountType: 'flat', discountValue: 20000, minimumOrderKobo: 100000, maxDiscountKobo: 20000, startsAt: '2026-01-01', expiresAt: '2027-01-01', usageLimit: 5000, active: true },
  { id: 'voucher_freeship', code: 'FREESHIP', description: 'Free delivery up to ₦1,000', discountType: 'delivery', discountValue: 100000, minimumOrderKobo: 300000, maxDiscountKobo: 100000, startsAt: '2026-01-01', expiresAt: '2027-01-01', usageLimit: 2000, active: true },
];

const FAQS = [
  { id: 'faq_1', category: 'Orders', question: 'How do I track my order?', answer: 'Open Orders, pick the order and follow the status timeline.' },
  { id: 'faq_2', category: 'Orders', question: 'Can I cancel an order?', answer: 'You can cancel while it is still pending payment or confirmed.' },
  { id: 'faq_3', category: 'Payments', question: 'Is my payment real?', answer: 'The first release uses demo payments. No money is charged.' },
  { id: 'faq_4', category: 'Account', question: 'How do I change my phone number?', answer: 'Edit it in Personal details and verify the new number.' },
  { id: 'faq_5', category: 'Delivery', question: 'Why is my address not serviceable?', answer: 'We deliver to mapped zones only. Try a nearby landmark.' },
  { id: 'faq_6', category: 'Vouchers', question: 'Where do I enter a voucher code?', answer: 'Enter it on the cart screen before checkout.' },
];

const LEGAL = [
  { id: 'legal_terms', documentType: 'terms', title: 'Terms of service', version: 'v0.1.0', body: 'ChowIt demo terms. Use the app for lawful food ordering.' },
  { id: 'legal_privacy', documentType: 'privacy', title: 'Privacy policy', version: 'v0.1.0', body: 'We store your profile, addresses and orders to run the service.' },
  { id: 'legal_delivery', documentType: 'delivery', title: 'Delivery and cancellation policy', version: 'v0.1.0', body: 'Cancel before preparation starts. Fees follow the checkout quote.' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
}

export function loadSeed(): SeedResult {
  const restaurants = RESTAURANTS.map((r, index) => ({
    id: r.id,
    name: r.name,
    slug: slugify(r.name),
    description: `${r.name} serves ${r.categories.length} cuisines in ${r.city}.`,
    logoUrl: img(`${r.id}-logo`),
    coverUrl: img(`${r.id}-cover`),
    rating: r.rating,
    reviewCount: r.reviews,
    prepMinMinutes: r.prepMin,
    prepMaxMinutes: r.prepMax,
    minimumOrderKobo: r.minOrder,
    deliveryFeeKobo: 100000,
    isOpen: true,
    isActive: true,
    city: r.city,
    sortOrder: index + 1,
  }));
  const restaurantCategories = RESTAURANTS.flatMap((r) =>
    r.categories.map((categoryId) => ({ restaurantId: r.id, categoryId })),
  );
  const menuCategories: Array<Record<string, unknown>> = [];
  const menuItems: Array<Record<string, unknown>> = [];
  const optionGroups: Array<Record<string, unknown>> = [];
  const options: Array<Record<string, unknown>> = [];
  const addons: Array<Record<string, unknown>> = [];
  let itemCounter = 0;
  for (const restaurant of RESTAURANTS) {
    MENU_CATEGORY_NAMES.forEach((name, sortOrder) => {
      menuCategories.push({ id: `mcat_${restaurant.id}_${sortOrder}`, restaurantId: restaurant.id, name, sortOrder, isActive: true });
    });
    const specs = MENU[restaurant.id] ?? [];
    specs.forEach(([name, description, basePriceKobo, customisable, isAvailable], i) => {
      itemCounter += 1;
      const itemId = `meal_${restaurant.id.replace('rest_', '')}_${i + 1}`;
      const categoryId = `mcat_${restaurant.id}_${i % MENU_CATEGORY_NAMES.length}`;
      menuItems.push({ id: itemId, restaurantId: restaurant.id, menuCategoryId: categoryId, name, description, imageUrl: img(itemId), basePriceKobo, isAvailable, sortOrder: i + 1 });
      if (customisable) {
        const sizeGroup = `${itemId}_size`;
        const proteinGroup = `${itemId}_protein`;
        optionGroups.push({ id: sizeGroup, menuItemId: itemId, name: 'Size', required: true, minSelect: 1, maxSelect: 1 });
        optionGroups.push({ id: proteinGroup, menuItemId: itemId, name: 'Protein', required: true, minSelect: 1, maxSelect: 1 });
        options.push({ id: `${itemId}_size_regular`, groupId: sizeGroup, name: 'Regular', priceDeltaKobo: 0, isAvailable: true });
        options.push({ id: `${itemId}_size_large`, groupId: sizeGroup, name: 'Large', priceDeltaKobo: 50000, isAvailable: true });
        options.push({ id: `${itemId}_protein_chicken`, groupId: proteinGroup, name: 'Chicken', priceDeltaKobo: 0, isAvailable: true });
        options.push({ id: `${itemId}_protein_beef`, groupId: proteinGroup, name: 'Beef', priceDeltaKobo: 30000, isAvailable: true });
        options.push({ id: `${itemId}_protein_turkey`, groupId: proteinGroup, name: 'Turkey', priceDeltaKobo: 120000, isAvailable: true });
        addons.push({ id: `${itemId}_addon_plantain`, menuItemId: itemId, name: 'Extra plantain', priceKobo: 50000, isAvailable: true });
        addons.push({ id: `${itemId}_addon_chicken`, menuItemId: itemId, name: 'Extra chicken', priceKobo: 150000, isAvailable: true });
      }
    });
  }
  const catalogue: Record<string, Array<Record<string, unknown>>> = {
    banners: BANNERS, categories: CATEGORIES, restaurants, restaurantCategories,
    menuCategories, menuItems, optionGroups, options, addons,
  };
  void itemCounter;
  return { catalogue, vouchers: VOUCHERS, faqs: FAQS, legal: LEGAL };
}

// `npm run seed` writes portable JSON + prints a summary for DB population.
const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('/seed.ts');
if (isDirectRun) {
  const seed = loadSeed();
  const counts = Object.fromEntries(
    Object.entries(seed.catalogue).map(([key, rows]) => [key, rows.length]),
  );
  counts.vouchers = seed.vouchers.length;
  counts.faqs = seed.faqs.length;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), counts }, null, 2));
}


