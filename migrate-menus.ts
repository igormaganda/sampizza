import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting menus system migration...');

  try {
    // Step 1: Rename menu_items table to products
    console.log('Step 1: Renaming menu_items to products...');
    await db.run(sql`ALTER TABLE menu_items RENAME TO products`);
    console.log('✓ Renamed menu_items to products');

    // Step 2: Update order_items foreign key reference
    console.log('Step 2: Updating order_items table...');
    // SQLite doesn't support ALTER COLUMN directly, so we recreate the table
    await db.run(sql`
      CREATE TABLE order_items_new (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        total_price REAL NOT NULL,
        configurations TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    await db.run(sql`
      INSERT INTO order_items_new (id, order_id, product_id, quantity, total_price, configurations)
      SELECT id, order_id, menu_item_id, quantity, total_price, configurations
      FROM order_items
    `);

    await db.run(sql`DROP TABLE order_items`);
    await db.run(sql`ALTER TABLE order_items_new RENAME TO order_items`);
    console.log('✓ Updated order_items table');

    // Step 3: Create menus table
    console.log('Step 3: Creating menus table...');
    await db.run(sql`
      CREATE TABLE menus (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price_ht REAL NOT NULL,
        vat_rate REAL NOT NULL DEFAULT 10.0,
        price REAL NOT NULL,
        image TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 1
      )
    `);
    console.log('✓ Created menus table');

    // Step 4: Create menu_compositions table
    console.log('Step 4: Creating menu_compositions table...');
    await db.run(sql`
      CREATE TABLE menu_compositions (
        id TEXT PRIMARY KEY,
        menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        required INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log('✓ Created menu_compositions table');

    // Step 5: Create some example menus
    console.log('Step 5: Creating example menus...');
    const exampleMenus = [
      {
        id: 'menu_1',
        name: 'Menu Pizza',
        description: 'Pizza au choix + boisson + dessert',
        priceHT: 15.45,
        vatRate: 10.0,
        price: 17.0,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        sortOrder: 1,
        available: 1,
      },
      {
        id: 'menu_2',
        name: 'Menu Burger',
        description: 'Burger au choix + frites + boisson',
        priceHT: 16.36,
        vatRate: 10.0,
        price: 18.0,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        sortOrder: 2,
        available: 1,
      },
      {
        id: 'menu_3',
        name: 'Menu Enfant',
        description: 'Pizza enfant + boisson + glace',
        priceHT: 10.0,
        vatRate: 10.0,
        price: 11.0,
        image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
        sortOrder: 3,
        available: 1,
      },
    ];

    for (const menu of exampleMenus) {
      await db.run(sql`
        INSERT INTO menus (id, name, description, price_ht, vat_rate, price, image, sort_order, available)
        VALUES (${menu.id}, ${menu.name}, ${menu.description}, ${menu.priceHT}, ${menu.vatRate}, ${menu.price}, ${menu.image}, ${menu.sortOrder}, ${menu.available})
      `);
    }
    console.log('✓ Created example menus');

    console.log('\n✅ Menus system migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update server.ts to use the new tables');
    console.log('2. Add API routes for menus CRUD operations');
    console.log('3. Update FrontOffice to display menus');
    console.log('4. Update BackOffice to manage menus');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrate().catch(console.error);
