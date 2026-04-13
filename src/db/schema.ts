import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const products = sqliteTable('products', {
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

export const menus = sqliteTable('menus', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  priceHT: real('price_ht').notNull(),
  vatRate: real('vat_rate').notNull().default(10.0), // 5.5, 10, or 20
  price: real('price').notNull(), // TTC price
  image: text('image').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
});

export const menuCompositions = sqliteTable('menu_compositions', {
  id: text('id').primaryKey(),
  menuId: text('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  category: text('category').notNull(), // 'principal', 'accompagnement', 'boisson', 'dessert'
  quantity: integer('quantity').notNull().default(1),
  required: integer('required', { mode: 'boolean' }).notNull().default(true),
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
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  totalPrice: real('total_price').notNull(),
  configurations: text('configurations').notNull(), // JSON string of selected config options
});
