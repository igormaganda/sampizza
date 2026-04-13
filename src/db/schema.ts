import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const menuItems = sqliteTable('menu_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  basePriceHT: real('base_price_ht').notNull(),
  vatRate: real('vat_rate').notNull().default(10.0), // 5.5, 10, or 20
  basePrice: real('base_price').notNull(), // TTC price (calculated or stored)
  image: text('image').notNull(),
  category: text('category').notNull(),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  allowedConfigCategories: text('allowed_config_categories').notNull(), // JSON string array
});

export const configOptions = sqliteTable('config_options', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  priceHT: real('price_ht').notNull(),
  vatRate: real('vat_rate').notNull().default(10.0), // 5.5, 10, or 20
  price: real('price').notNull(), // TTC price (calculated or stored)
  category: text('category').notNull(),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  total: real('total').notNull(),
  status: text('status').notNull(), // 'en_attente', 'en_preparation', 'pret', 'livre'
  deliveryMethod: text('delivery_method').notNull(), // 'sur_place', 'livraison'
  deliveryDate: text('delivery_date'),
  deliveryTime: text('delivery_time'),
  comments: text('comments'),
  createdAt: text('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  totalPrice: real('total_price').notNull(),
  configurations: text('configurations').notNull(), // JSON string of selected config options
});
