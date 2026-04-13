import { pgTable, text, integer, numeric, boolean } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  image: text('image').notNull(),
  category: text('category').notNull(),
  available: boolean('available').notNull().default(true),
  allowedConfigCategories: text('allowed_config_categories').notNull(), // JSON string array
});

export const configOptions = pgTable('config_options', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull(), // 'en_attente', 'en_preparation', 'pret', 'livre'
  deliveryMethod: text('delivery_method').notNull(), // 'sur_place', 'livraison'
  deliveryDate: text('delivery_date'),
  deliveryTime: text('delivery_time'),
  comments: text('comments'),
  createdAt: text('created_at').notNull(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  configurations: text('configurations').notNull(), // JSON string of selected config options
});
