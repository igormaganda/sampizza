import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import path from 'path';
import { db } from './src/db/index';
import { products, menus, menuCompositions, configOptions, orders, orderItems, customers, categories } from './src/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

// Initialize Stripe with environment variable (REQUIRED)
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: '2023-10-16' as any,
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Stripe Webhook MUST be before express.json() because it needs the raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        // Fallback for development without webhook secret (not recommended for production)
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        try {
          // Update order status to 'en_attente' (paid, waiting for preparation)
          await db.update(orders).set({ status: 'en_attente' }).where(eq(orders.id, orderId));
          console.log(`Order ${orderId} marked as paid (en_attente)`);
        } catch (err) {
          console.error('Error updating order status:', err);
        }
      }
    }

    res.json({ received: true });
  });

  // CORS is handled by Apache reverse proxy - removed middleware to avoid duplicate headers
  app.use(express.json());

  // Admin Authentication Middleware
  const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.split(' ')[1];

    // In production, verify JWT token here
    // For now, simple token check
    if (token !== 'admin-token-xyz') {
      return res.status(403).json({ error: 'Token invalide' });
    }

    next();
  };

  // API routes
  app.get('/api/menu', async (req, res) => {
    try {
      const items = await db.select().from(products);
      const configs = await db.select().from(configOptions);

      // Parse JSON string back to array for frontend
      const formattedItems = items.map(item => ({
        ...item,
        allowedConfigCategories: JSON.parse(item.allowedConfigCategories as string)
      }));

      res.json({ products: formattedItems, configOptions: configs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/menu', authenticateAdmin, async (req, res) => {
    try {
      const { name, description, basePriceHT, vatRate, image, category, allowedConfigCategories } = req.body;
      const newItemId = `m_${Date.now()}`;
      const basePrice = basePriceHT * (1 + vatRate / 100);

      await db.insert(products).values({
        id: newItemId,
        name,
        description,
        basePriceHT: parseFloat(basePriceHT),
        vatRate: parseFloat(vatRate),
        basePrice: parseFloat(basePrice.toFixed(2)),
        image,
        category,
        available: true,
        allowedConfigCategories: JSON.stringify(allowedConfigCategories || []),
      });

      res.json({ success: true, id: newItemId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/menu/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, basePriceHT, vatRate, basePrice, image, category, available, allowedConfigCategories } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (basePriceHT !== undefined) updateData.basePriceHT = parseFloat(basePriceHT);
      if (vatRate !== undefined) updateData.vatRate = parseFloat(vatRate);
      if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
      if (image !== undefined) updateData.image = image;
      if (category !== undefined) updateData.category = category;
      if (available !== undefined) updateData.available = available;
      if (allowedConfigCategories !== undefined) updateData.allowedConfigCategories = JSON.stringify(allowedConfigCategories);

      await db.update(products).set(updateData).where(eq(products.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/menu/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(products).where(eq(products.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Categories endpoints
  app.get('/api/categories', authenticateAdmin, async (req, res) => {
    try {
      const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
      res.json(allCategories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/categories', authenticateAdmin, async (req, res) => {
    try {
      const { name, sortOrder } = req.body;
      const newCategoryId = `cat_${Date.now()}`;

      await db.insert(categories).values({
        id: newCategoryId,
        name,
        sortOrder: sortOrder || 0,
      });

      res.json({ success: true, id: newCategoryId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/categories/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, sortOrder } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      await db.update(categories).set(updateData).where(eq(categories.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/categories/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(categories).where(eq(categories.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Menus endpoints
  app.get('/api/menus', async (req, res) => {
    try {
      const allMenus = await db.select().from(menus).orderBy(menus.sortOrder);

      // Get compositions for each menu
      const menusWithCompositions = await Promise.all(allMenus.map(async (menu) => {
        const compositions = await db.select().from(menuCompositions).where(eq(menuCompositions.menuId, menu.id));

        // Get product details for each composition
        const compositionsWithProducts = await Promise.all(compositions.map(async (comp) => {
          const product = await db.select().from(products).where(eq(products.id, comp.productId)).limit(1);
          return {
            ...comp,
            product: product[0] || null,
          };
        }));

        return {
          ...menu,
          compositions: compositionsWithProducts,
        };
      }));

      res.json(menusWithCompositions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/menus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const menuData = await db.select().from(menus).where(eq(menus.id, id)).limit(1);

      if (menuData.length === 0) {
        return res.status(404).json({ error: 'Menu not found' });
      }

      const menu = menuData[0];
      const compositions = await db.select().from(menuCompositions).where(eq(menuCompositions.menuId, menu.id));

      // Get product details for each composition
      const compositionsWithProducts = await Promise.all(compositions.map(async (comp) => {
        const product = await db.select().from(products).where(eq(products.id, comp.productId)).limit(1);
        return {
          ...comp,
          product: product[0] || null,
        };
      }));

      res.json({ ...menu, compositions: compositionsWithProducts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/menus', authenticateAdmin, async (req, res) => {
    try {
      const { name, description, priceHT, vatRate, image, sortOrder, available, compositions } = req.body;
      const newMenuId = `menu_${Date.now()}`;
      const price = priceHT * (1 + vatRate / 100);

      await db.insert(menus).values({
        id: newMenuId,
        name,
        description: description || null,
        priceHT: parseFloat(priceHT),
        vatRate: parseFloat(vatRate),
        price: parseFloat(price.toFixed(2)),
        image,
        sortOrder: sortOrder || 0,
        available: available !== undefined ? available : true,
      });

      // Insert compositions if provided
      if (compositions && Array.isArray(compositions)) {
        for (const comp of compositions) {
          const compId = `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.insert(menuCompositions).values({
            id: compId,
            menuId: newMenuId,
            productId: comp.productId,
            category: comp.category,
            quantity: comp.quantity || 1,
            required: comp.required !== undefined ? comp.required : true,
          });
        }
      }

      res.json({ success: true, id: newMenuId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/menus/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, priceHT, vatRate, price, image, sortOrder, available, compositions } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (priceHT !== undefined) updateData.priceHT = parseFloat(priceHT);
      if (vatRate !== undefined) updateData.vatRate = parseFloat(vatRate);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (image !== undefined) updateData.image = image;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
      if (available !== undefined) updateData.available = available;

      await db.update(menus).set(updateData).where(eq(menus.id, id));

      // Update compositions if provided
      if (compositions && Array.isArray(compositions)) {
        // Delete existing compositions
        await db.delete(menuCompositions).where(eq(menuCompositions.menuId, id));

        // Insert new compositions
        for (const comp of compositions) {
          const compId = `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.insert(menuCompositions).values({
            id: compId,
            menuId: id,
            productId: comp.productId,
            category: comp.category,
            quantity: comp.quantity || 1,
            required: comp.required !== undefined ? comp.required : true,
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/menus/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(menus).where(eq(menus.id, id));
      // Compositions will be deleted automatically due to CASCADE
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Config options endpoints
  app.get('/api/config-options', authenticateAdmin, async (req, res) => {
    try {
      const allOptions = await db.select().from(configOptions);
      res.json(allOptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/config-options', authenticateAdmin, async (req, res) => {
    try {
      const { name, priceHT, vatRate, category } = req.body;
      const newOptionId = `opt_${Date.now()}`;
      const price = priceHT * (1 + vatRate / 100);

      await db.insert(configOptions).values({
        id: newOptionId,
        name,
        priceHT: parseFloat(priceHT),
        vatRate: parseFloat(vatRate),
        price: parseFloat(price.toFixed(2)),
        category,
      });

      res.json({ success: true, id: newOptionId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/config-options/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, priceHT, vatRate, price, category } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (priceHT !== undefined) updateData.priceHT = parseFloat(priceHT);
      if (vatRate !== undefined) updateData.vatRate = parseFloat(vatRate);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category !== undefined) updateData.category = category;

      await db.update(configOptions).set(updateData).where(eq(configOptions.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/config-options/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(configOptions).where(eq(configOptions.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { items, deliveryMethod, customerName, customerEmail, customerPhone, deliveryDate, deliveryTime, comments, total } = req.body;

      // 1. Handle Customer
      let customerId = `cust_${Date.now()}`;
      const customerNameStr = customerName || 'Client Web';
      
      // Check if customer exists by name (simple approach for now, usually by email/phone)
      const existingCustomer = await db.select().from(customers).where(eq(customers.name, customerNameStr)).limit(1);
      
      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        // Optionally update email/phone if provided
        if (customerEmail || customerPhone) {
           await db.update(customers).set({
             email: customerEmail || existingCustomer[0].email,
             phone: customerPhone || existingCustomer[0].phone
           }).where(eq(customers.id, customerId));
        }
      } else {
        await db.insert(customers).values({
          id: customerId,
          name: customerNameStr,
          email: customerEmail || null,
          phone: customerPhone || null,
        });
      }

      const orderId = `ord_${Date.now()}`;

      await db.insert(orders).values({
        id: orderId,
        customerId: customerId,
        customerName: customerNameStr,
        total,
        status: 'en_attente',
        deliveryMethod,
        deliveryDate,
        deliveryTime,
        comments,
        createdAt: new Date().toISOString(),
      });

      for (const item of items) {
        await db.insert(orderItems).values({
          id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          configurations: JSON.stringify(item.configurations),
        });
      }

      res.json({ success: true, orderId });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/customers', authenticateAdmin, async (req, res) => {
    try {
      const allCustomers = await db.select().from(customers);
      
      // Get order stats for each customer
      const customersWithStats = await Promise.all(allCustomers.map(async (customer) => {
        const customerOrders = await db.select().from(orders).where(eq(orders.customerId, customer.id));
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        return {
          ...customer,
          totalOrders: customerOrders.length,
          totalSpent,
          lastOrderDate: lastOrder ? lastOrder.createdAt : null
        };
      }));
      
      res.json(customersWithStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/orders', authenticateAdmin, async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      // In a real app we would join with orderItems and menuItems, but for simplicity we'll just return orders
      // or we can fetch items for each order
      const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        const itemsWithMenuData = await Promise.all(items.map(async (item) => {
          const productData = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
          return {
            ...item,
            product: productData[0],
            configurations: JSON.parse(item.configurations as string)
          };
        }));
        return { ...order, items: itemsWithMenuData };
      }));
      res.json(ordersWithItems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/orders/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const orderData = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      
      if (orderData.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderData[0];
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsWithMenuData = await Promise.all(items.map(async (item) => {
        const productData = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        return {
          ...item,
          product: productData[0],
          configurations: JSON.parse(item.configurations as string)
        };
      }));

      res.json({ ...order, items: itemsWithMenuData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.update(orders).set({ status }).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    // In a real app, use a secure hashed password from the database or env variables
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SamPizza2024!Admin';

    if (password === ADMIN_PASSWORD) {
      // Return a simple token (in a real app, use JWT)
      res.json({ success: true, token: 'admin-token-xyz' });
    } else {
      res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
    }
  });

  app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      
      const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = allOrders.length;
      
      // Group by date for chart
      const revenueByDate = allOrders.reduce((acc: any, order) => {
        const date = order.createdAt.split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date] += order.total;
        return acc;
      }, {});

      const chartData = Object.keys(revenueByDate).map(date => ({
        date,
        revenue: revenueByDate[date]
      })).reverse(); // Chronological order

      res.json({
        totalRevenue,
        totalOrders,
        recentOrders: allOrders.slice(0, 10),
        chartData
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { items, deliveryMethod, customerName, customerEmail, customerPhone, deliveryDate, deliveryTime, comments, total } = req.body;

      console.log('Creating checkout session with data:', { items, deliveryMethod, total });

      // 1. Handle Customer
      let customerId = `cust_${Date.now()}`;
      const customerNameStr = customerName || 'Client Web';

      const existingCustomer = await db.select().from(customers).where(eq(customers.name, customerNameStr)).limit(1);

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        if (customerEmail || customerPhone) {
           await db.update(customers).set({
             email: customerEmail || existingCustomer[0].email,
             phone: customerPhone || existingCustomer[0].phone
           }).where(eq(customers.id, customerId));
        }
      } else {
        await db.insert(customers).values({
          id: customerId,
          name: customerNameStr,
          email: customerEmail || null,
          phone: customerPhone || null,
        });
      }

      // 2. Create order in database with status 'attente_paiement'
      const orderId = `ord_${Date.now()}`;

      await db.insert(orders).values({
        id: orderId,
        customerId: customerId,
        customerName: customerNameStr,
        total: total || items.reduce((sum: number, item: any) => sum + item.totalPrice, 0) + (deliveryMethod === 'livraison' ? 2.5 : 0),
        status: 'attente_paiement',
        deliveryMethod,
        deliveryDate,
        deliveryTime,
        comments,
        createdAt: new Date().toISOString(),
      });

      for (const item of items) {
        await db.insert(orderItems).values({
          id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          configurations: JSON.stringify(item.configurations),
        });
      }

      // 3. Create Stripe session
      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.menuItem.name,
            description: item.configurations && item.configurations.length > 0
              ? `Options: ${item.configurations.map((t: any) => t.name).join(', ')}`
              : undefined,
          },
          unit_amount: Math.round((item.totalPrice / item.quantity) * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      }));

      // Add delivery fee if applicable
      if (deliveryMethod === 'livraison') {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de livraison',
            },
            unit_amount: 250, // 2.50€
          },
          quantity: 1,
        });
      }

      console.log('Creating Stripe session with line items:', lineItems);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'https://sam-pizza.mgd-crm.com'}/success?orderId=${orderId}&customerName=${encodeURIComponent(customerName || 'Client Web')}`,
        cancel_url: `${process.env.APP_URL || 'https://sam-pizza.mgd-crm.com'}/cancel`,
        metadata: {
          orderId: orderId,
          customerName: customerName || 'Client Web',
          deliveryMethod,
        }
      });

      console.log('Stripe session created:', session.id);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack
      });

      // Provide more detailed error information
      let errorMessage = 'Erreur lors du paiement';
      if (error.type === 'StripeCardError') {
        errorMessage = 'Erreur de carte bancaire';
      } else if (error.type === 'StripeInvalidRequestError') {
        errorMessage = 'Configuration de paiement invalide';
      } else if (error.type === 'StripeAPIError') {
        errorMessage = 'Erreur de connexion avec le service de paiement';
      }

      res.status(500).json({
        error: errorMessage,
        details: error.message,
        type: error.type
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
