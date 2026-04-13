import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
export const db = drizzle(sqlite, { schema });

// Initialize database tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    base_price REAL NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    allowed_config_categories TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS config_options (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    delivery_method TEXT NOT NULL,
    delivery_date TEXT,
    delivery_time TEXT,
    comments TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL NOT NULL,
    configurations TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
  );
`);

// Seed data if empty
const checkMenu = sqlite.prepare('SELECT COUNT(*) as count FROM menu_items').get() as { count: number };
if (checkMenu.count === 0) {
  console.log('Seeding database...');
  
  const MOCK_CONFIG_OPTIONS = [
    { id: 'c1', name: 'Moyenne (33cm)', price: 0, category: 'taille' },
    { id: 'c2', name: 'Grande (40cm)', price: 4.0, category: 'taille' },
    { id: 'c3', name: 'Ketchup', price: 0.5, category: 'sauce' },
    { id: 'c4', name: 'Mayonnaise', price: 0.5, category: 'sauce' },
    { id: 'c5', name: 'Sauce Algérienne', price: 0.5, category: 'sauce' },
    { id: 'c6', name: 'Sauce Samouraï', price: 0.5, category: 'sauce' },
    { id: 'c7', name: 'Extra Mozzarella', price: 1.5, category: 'fromage' },
    { id: 'c8', name: 'Chèvre', price: 2.0, category: 'fromage' },
    { id: 'c9', name: 'Poulet Tikka', price: 2.5, category: 'viande' },
    { id: 'c10', name: 'Viande Hachée', price: 2.5, category: 'viande' },
    { id: 'c11', name: 'Champignons', price: 1.0, category: 'legumes' },
    { id: 'c12', name: 'Oignons', price: 0.5, category: 'legumes' },
    { id: 'c13', name: 'Bien cuit', price: 0, category: 'cuisson' },
    { id: 'c14', name: 'À point', price: 0, category: 'cuisson' },
  ];

  const MOCK_MENU_ITEMS = [
    {
      id: 'm1',
      name: 'Margherita',
      description: "Sauce tomate San Marzano, mozzarella fior di latte, basilic frais, huile d'olive extra vierge.",
      basePrice: 10.50,
      image: 'https://images.pexels.com/photos/35068608/pexels-photo-35068608.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'pizza',
      available: true,
      allowedConfigCategories: ['taille', 'fromage', 'viande', 'legumes'],
    },
    {
      id: 'm2',
      name: 'La Reine',
      description: 'Sauce tomate, mozzarella, jambon supérieur, champignons frais sautés.',
      basePrice: 12.00,
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'pizza',
      available: true,
      allowedConfigCategories: ['taille', 'fromage', 'viande', 'legumes'],
    },
    {
      id: 'm3',
      name: 'Panini Poulet',
      description: 'Escalope de poulet grillée, sauce curry maison, fromage fondant, pain ciabatta toasté.',
      basePrice: 8.50,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'panini',
      available: true,
      allowedConfigCategories: ['sauce', 'supplement', 'fromage'],
    },
    {
      id: 'm4',
      name: 'Panini Steak',
      description: 'Steak haché pur bœuf, cheddar fondant, oignons caramélisés, accompagné de frites.',
      basePrice: 9.00,
      image: 'https://images.unsplash.com/photo-1553909489-cd47ce7f2060?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'panini',
      available: true,
      allowedConfigCategories: ['sauce', 'cuisson', 'fromage'],
    },
    {
      id: 'm5',
      name: 'Salade César',
      description: 'Laitue romaine, poulet grillé, croûtons, parmesan, sauce César maison.',
      basePrice: 11.00,
      image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'salade',
      available: true,
      allowedConfigCategories: ['sauce'],
    },
    {
      id: 'm6',
      name: 'Tiramisu Maison',
      description: 'Véritable tiramisu italien au café et mascarpone.',
      basePrice: 5.50,
      image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'dessert',
      available: true,
      allowedConfigCategories: [],
    },
    {
      id: 'm7',
      name: 'Coca-Cola 33cl',
      description: 'Canette bien fraîche.',
      basePrice: 2.00,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'boisson',
      available: true,
      allowedConfigCategories: [],
    }
  ];

  const insertConfig = sqlite.prepare('INSERT INTO config_options (id, name, price, category) VALUES (?, ?, ?, ?)');
  MOCK_CONFIG_OPTIONS.forEach(opt => {
    insertConfig.run(opt.id, opt.name, opt.price, opt.category);
  });

  const insertMenu = sqlite.prepare('INSERT INTO menu_items (id, name, description, base_price, image, category, available, allowed_config_categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  MOCK_MENU_ITEMS.forEach(item => {
    insertMenu.run(item.id, item.name, item.description, item.basePrice, item.image, item.category, item.available ? 1 : 0, JSON.stringify(item.allowedConfigCategories));
  });

  console.log('Database seeded successfully.');
}
