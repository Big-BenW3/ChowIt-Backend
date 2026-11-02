import type { FastifyInstance } from 'fastify';
import { notFound } from '../shared/errors.js';
import { cleanText } from '../shared/sanitize.js';
import { requireCustomer, envelope } from '../shared/context.js';
import { db } from '../database/store.js';

export async function discoveryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/home', async (request) => {
    requireCustomer(request);
    const featured = db.restaurants.slice(0, 5);
    const specials = db.menuItems.slice(0, 6);
    const budgetMeals = db.menuItems.filter((m) => (m.basePriceKobo as number) < 200000).slice(0, 8);
    return envelope({
      banners: db.banners,
      categories: db.categories,
      featuredRestaurants: featured,
      specials,
      budgetMeals,
      recommendations: db.restaurants.slice(5, 9),
    });
  });

  app.get('/api/v1/banners', async () => envelope(db.banners));
  app.get('/api/v1/categories', async () => envelope(db.categories));

  app.get('/api/v1/restaurants', async (request) => {
    const query = request.query as { q?: string; categoryId?: string; page?: string; limit?: string };
    const q = cleanText(query.q, 60).toLowerCase();
    let rows = db.restaurants;
    if (q) rows = rows.filter((r) => String(r.name).toLowerCase().includes(q) || String(r.city).toLowerCase().includes(q));
    if (query.categoryId) {
      const ids = db.restaurantCategories
        .filter((rc) => rc.categoryId === query.categoryId)
        .map((rc) => rc.restaurantId);
      rows = rows.filter((r) => ids.includes(String(r.id)));
    }
    const limit = Math.min(Number(query.limit) || 20, 50);
    const page = Math.max(Number(query.page) || 1, 1);
    const total = rows.length;
    const data = rows.slice((page - 1) * limit, page * limit);
    return envelope(data, { page, limit, total, hasMore: page * limit < total });
  });

  app.get('/api/v1/restaurants/:restaurantId', async (request) => {
    const { restaurantId } = request.params as { restaurantId: string };
    const restaurant = db.restaurants.find((r) => r.id === restaurantId);
    if (!restaurant) throw notFound('Restaurant not found.');
    return envelope(restaurant);
  });

  app.get('/api/v1/restaurants/:restaurantId/menu', async (request) => {
    const { restaurantId } = request.params as { restaurantId: string };
    const groups = db.menuCategories.filter((c) => c.restaurantId === restaurantId);
    const items = db.menuItems.filter((m) => m.restaurantId === restaurantId);
    const menu = groups.map((group) => ({
      ...group,
      items: items.filter((item) => item.menuCategoryId === group.id),
    }));
    return envelope(menu);
  });

  app.get('/api/v1/menu-items/:menuItemId', async (request) => {
    const { menuItemId } = request.params as { menuItemId: string };
    const item = db.menuItems.find((m) => m.id === menuItemId);
    if (!item) throw notFound('Meal not found.');
    const groups = db.optionGroups
      .filter((g) => g.menuItemId === menuItemId)
      .map((group) => ({ ...group, options: db.options.filter((o) => o.groupId === group.id) }));
    const addons = db.addons.filter((a) => a.menuItemId === menuItemId);
    return envelope({ ...item, optionGroups: groups, addons });
  });

  app.get('/api/v1/search', async (request) => {
    const query = request.query as { q?: string; type?: string };
    const q = cleanText(query.q, 60).toLowerCase();
    if (!q) return envelope({ restaurants: [], meals: [] });
    const restaurants = db.restaurants
      .filter((r) => String(r.name).toLowerCase().includes(q))
      .slice(0, 10);
    const meals = db.menuItems
      .filter((m) => String(m.name).toLowerCase().includes(q))
      .slice(0, 20);
    if (query.type === 'restaurants') return envelope({ restaurants, meals: [] });
    if (query.type === 'meals') return envelope({ restaurants: [], meals });
    return envelope({ restaurants, meals });
  });

  app.get('/api/v1/recommendations', async (request) => {
    requireCustomer(request);
    return envelope(db.menuItems.slice(0, 10));
  });
}
