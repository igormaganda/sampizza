import { db } from './src/db/index';
import { categories } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function updateCategories() {
  console.log('Updating categories to match the new list...');

  const newCategoryList = [
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

  try {
    // Delete all existing categories
    await db.delete(categories);
    console.log('✓ Deleted existing categories');

    // Insert new categories
    await db.insert(categories).values(newCategoryList);
    console.log(`✓ Created ${newCategoryList.length} categories`);

    console.log('\nNew categories list:');
    newCategoryList.forEach(cat => {
      console.log(`  - ${cat.name} (ordre: ${cat.sortOrder})`);
    });
  } catch (error) {
    console.error('Error updating categories:', error);
  }

  console.log('\nCategories update completed!');
  process.exit(0);
}

updateCategories().catch(console.error);