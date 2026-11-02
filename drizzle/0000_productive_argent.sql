CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"landmark" text DEFAULT '' NOT NULL,
	"city" text DEFAULT 'Onitsha' NOT NULL,
	"state" text DEFAULT 'Anambra' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"instructions" text DEFAULT '' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"deep_link_type" text DEFAULT '' NOT NULL,
	"deep_link_id" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active_from" timestamp with time zone,
	"active_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"menu_item_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"selected_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "checkout_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"cart_id" text,
	"address_id" text,
	"subtotal_kobo" integer NOT NULL,
	"delivery_fee_kobo" integer NOT NULL,
	"service_fee_kobo" integer DEFAULT 0 NOT NULL,
	"discount_kobo" integer DEFAULT 0 NOT NULL,
	"total_kobo" integer NOT NULL,
	"quote_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"device_label" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "customer_vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"voucher_id" text NOT NULL,
	"redeemed_at" timestamp with time zone,
	"order_id" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"phone_e164" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone_verified_at" timestamp with time zone,
	"avatar_key" text,
	"referral_code" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_username_unique" UNIQUE("username"),
	CONSTRAINT "customers_phone_e164_unique" UNIQUE("phone_e164")
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_customer_id" text,
	"recipient_name" text DEFAULT '' NOT NULL,
	"recipient_phone" text DEFAULT '' NOT NULL,
	"code_hash" text NOT NULL,
	"balance_kobo" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"route_key" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_json" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "menu_addons" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"name" text NOT NULL,
	"price_kobo" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"menu_category_id" text,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"base_price_kobo" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_option_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"name" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"min_select" integer DEFAULT 0 NOT NULL,
	"max_select" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_options" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"price_delta_kobo" integer DEFAULT 0 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"read_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text,
	"item_name_snapshot" text NOT NULL,
	"option_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"unit_price_kobo" integer NOT NULL,
	"line_total_kobo" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"actor_id" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"address_snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"subtotal_kobo" integer NOT NULL,
	"delivery_fee_kobo" integer NOT NULL,
	"service_fee_kobo" integer DEFAULT 0 NOT NULL,
	"discount_kobo" integer DEFAULT 0 NOT NULL,
	"total_kobo" integer NOT NULL,
	"vendor_note" text DEFAULT '' NOT NULL,
	"gift" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"method" text NOT NULL,
	"mode" text DEFAULT 'mock' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_kobo" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"provider_reference" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "phone_verification_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_customer_id" text,
	"referred_customer_id" text,
	"referral_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reward_state" text DEFAULT 'none' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_categories" (
	"restaurant_id" text NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"open_time" text NOT NULL,
	"close_time" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"rating" double precision DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"prep_min_minutes" integer DEFAULT 15 NOT NULL,
	"prep_max_minutes" integer DEFAULT 30 NOT NULL,
	"minimum_order_kobo" integer DEFAULT 0 NOT NULL,
	"delivery_fee_kobo" integer DEFAULT 100000 NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	CONSTRAINT "restaurants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"order_id" text,
	"topic" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"minimum_order_kobo" integer DEFAULT 0 NOT NULL,
	"max_discount_kobo" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"usage_limit" integer,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wallet_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"entry_type" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_quotes" ADD CONSTRAINT "checkout_quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_quotes" ADD CONSTRAINT "checkout_quotes_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_quotes" ADD CONSTRAINT "checkout_quotes_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vouchers" ADD CONSTRAINT "customer_vouchers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vouchers" ADD CONSTRAINT "customer_vouchers_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vouchers" ADD CONSTRAINT "customer_vouchers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_owner_customer_id_customers_id_fk" FOREIGN KEY ("owner_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_addons" ADD CONSTRAINT "menu_addons_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_category_id_menu_categories_id_fk" FOREIGN KEY ("menu_category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_option_groups" ADD CONSTRAINT "menu_option_groups_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_options" ADD CONSTRAINT "menu_options_group_id_menu_option_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."menu_option_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_customer_id_customers_id_fk" FOREIGN KEY ("referrer_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_customer_id_customers_id_fk" FOREIGN KEY ("referred_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_hours" ADD CONSTRAINT "restaurant_hours_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_customer_idx" ON "addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "sessions_customer_idx" ON "customer_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_unique" ON "idempotency_records" USING btree ("customer_id","route_key","idempotency_key");--> statement-breakpoint
CREATE INDEX "menu_items_restaurant_idx" ON "menu_items" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "notifications_customer_idx" ON "notifications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "status_events_order_idx" ON "order_status_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_category_unique" ON "restaurant_categories" USING btree ("restaurant_id","category_id");