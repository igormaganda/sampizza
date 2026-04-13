import { db } from './src/db/index';
import { menuItems, configOptions, categories } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting VAT migration...');

  // Remove vat_rate from categories if exists
  try {
    // Check if column exists and remove it
    await db.run(sql`ALTER TABLE categories DROP COLUMN vat_rate`);
    console.log('✓ Removed vat_rate from categories');
  } catch (e) {
    console.log('vat_rate does not exist in categories (or already removed)');
  }

  // Add base_price_ht and vat_rate columns to menu_items if not exists
  try {
    await db.run(sql`
      ALTER TABLE menu_items ADD COLUMN base_price_ht REAL
    `);
    console.log('✓ Added base_price_ht to menu_items');

    // Migrate existing basePrice to basePriceHT and calculate new basePrice as TTC
    const items = await db.select().from(menuItems);
    for (const item of items) {
      const htPrice = item.basePrice / 1.1; // Assume 10% VAT for existing items
      await db.update(menuItems)
        .set({
          basePriceHT: htPrice,
          vatRate: 10.0,
        })
        .where(sql`id = ${item.id}`);
    }
    console.log(`✓ Migrated ${items.length} menu items to VAT system`);
  } catch (e) {
    console.log('base_price_ht already exists in menu_items');

    // Just add vat_rate column if missing
    try {
      await db.run(sql`
        ALTER TABLE menu_items ADD COLUMN vat_rate REAL DEFAULT 10.0
      `);
      console.log('✓ Added vat_rate to menu_items');
    } catch (e2) {
      console.log('vat_rate already exists in menu_items');
    }
  }

  // Add price_ht and vat_rate columns to config_options if not exists
  try {
    await db.run(sql`
      ALTER TABLE config_options ADD COLUMN price_ht REAL
    `);
    console.log('✓ Added price_ht to config_options');

    // Migrate existing price to priceHT and calculate new price as TTC
    const options = await db.select().from(configOptions);
    for (const option of options) {
      const htPrice = option.price / 1.1; // Assume 10% VAT for existing options
      await db.update(configOptions)
        .set({
          priceHT: htPrice,
          vatRate: 10.0,
        })
        .where(sql`id = ${option.id}`);
    }
    console.log(`✓ Migrated ${options.length} config options to VAT system`);
  } catch (e) {
    console.log('price_ht already exists in config_options');

    // Just add vat_rate column if missing
    try {
      await db.run(sql`
        ALTER TABLE config_options ADD COLUMN vat_rate REAL DEFAULT 10.0
      `);
      console.log('✓ Added vat_rate to config_options');
    } catch (e2) {
      console.log('vat_rate already exists in config_options');
    }
  }

  // Create default categories if table is empty
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length === 0) {
    console.log('Creating default categories...');
    const defaultCategories = [
      { id: 'cat_1', name: 'Pizza', sortOrder: 1 },
      { id: 'cat_2', name: 'Burger', sortOrder: 2 },
      { id: 'cat_3', name: 'Sandwich', sortOrder: 3 },
      { id: 'cat_4', name: 'Wrap', sortOrder: 4 },
      { id: 'cat_5', name: 'Panini', sortOrder: 5 },
      { id: 'cat_6', name: 'Tacos', sortOrder: 6 },
      { id: 'cat_7', name: 'Kebab', sortOrder: 7 },
      { id: 'cat_8', name: 'Salade', sortOrder: 8 },
      { id: 'cat_9', name: 'Tex-Mex', sortOrder: 9 },
      { id: 'cat_10', name: 'Accompagnement', sortOrder: 10 },
      { id: 'cat_11', name: 'Boisson', sortOrder: 11 },
      { id: 'cat_12', name: 'Dessert', sortOrder: 12 },
      { id: 'cat_13', name: 'Menu Enfant', sortOrder: 13 },
    ];
    await db.insert(categories).values(defaultCategories);
    console.log(`✓ Created ${defaultCategories.length} default categories`);
  } else {
    console.log(`✓ Found ${existingCategories.length} existing categories`);
  }

  console.log('VAT migration completed!');
  process.exit(0);
}

migrate().catch(console.error);
