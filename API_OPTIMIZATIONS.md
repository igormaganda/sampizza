# 🚀 Optimisations API Backend - Recommandations

## 🎯 Objectif
Améliorer la performance, la robustesse et la sécurité de l'API Sam Pizza.

---

## 🔥 Optimisations Prioritaires

### 1. Cache Redis pour /api/menu
**Problème**: Le menu est rarement modifié mais requêté à chaque chargement  
**Gain**: Réduction de 90% de la charge DB pour cet endpoint

```typescript
// Installation: npm install ioredis
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

app.get('/api/menu', async (req, res) => {
  try {
    // Vérifier le cache
    const cached = await redis.get('menu:all');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Sinon, requêter la DB
    const items = await db.select().from(menuItems);
    const configs = await db.select().from(configOptions);
    const result = {
      menuItems: items.map(item => ({
        ...item,
        allowedConfigCategories: JSON.parse(item.allowedConfigCategories as string)
      })),
      configOptions: configs
    };

    // Mettre en cache (TTL: 1 heure)
    await redis.setex('menu:all', 3600, JSON.stringify(result));
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Invalidation du cache**:
```typescript
// Dans les routes POST/PUT/DELETE du menu
app.put('/api/menu/:id', async (req, res) => {
  try {
    // ... modification du menu ...
    await redis.del('menu:all'); // Invalider le cache
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 2. Connection Pooling PostgreSQL
**Problème**: Une connexion par requête = inefficace  
**Gain**: 30-50% d'amélioration des performances DB

```typescript
// Dans src/db/index-postgres.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'sampaizza',
  user: process.env.PGUSER || 'sampaizza_user',
  password: process.env.PGPASSWORD,
  max: 20, // Maximum connexions
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

---

### 3. Rate Limiting
**Problème**: API vulnérable aux abus et attaques  
**Gain**: Protection contre DDoS et abus

```typescript
// Installation: npm install express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite par IP
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer à toutes les routes API
app.use('/api/', limiter);

// Limite plus stricte pour les routes sensibles
const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 tentatives de paiement par heure
});
app.use('/api/create-checkout-session', checkoutLimiter);
```

---

### 4. Compression des Réponses
**Problème**: Payloads JSON volumineux  
**Gain**: 60-80% de réduction de la taille des réponses

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Comprimer si > 1KB
}));
```

---

### 5. Validation des Entrées
**Problème**: Données utilisateur non validées  
**Gain**: Sécurité et réduction des erreurs

```typescript
// Installation: npm install zod
import { z } from 'zod';

const orderSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
    totalPrice: z.number().positive(),
    configurations: z.array(z.any()),
  })).min(1),
  deliveryMethod: z.enum(['emporter', 'livraison']),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().regex(/^(\+\d{1,3}[- ]?)?\d{10}$/).optional(),
  total: z.number().positive(),
});

app.post('/api/orders', async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body);
    // ... suite du traitement ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }
    throw error;
  }
});
```

---

### 6. Health Check Endpoint
**Problème**: Impossible de vérifier l'état de l'API  
**Gain**: Monitoring facile

```typescript
app.get('/api/health', async (req, res) => {
  try {
    // Vérifier la connexion DB
    await db.select({ count: sql<number>`count(*)::int` }).from(menuItems);
    
    // Vérifier la connexion Stripe
    await stripe.prices.list({ limit: 1 });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        stripe: 'ok',
      }
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

### 7. Logging Structuré
**Problème**: Logs difficiles à analyser  
**Gain**: Debugging plus facile

```typescript
// Installation: npm install pino pino-http
import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/app.log',
      mkdir: true
    }
  }
});

app.use(pinoHttp({ logger }));

// Utilisation dans les routes:
app.get('/api/menu', async (req, res) => {
  const log = req.log;
  try {
    log.info({ endpoint: '/api/menu' }, 'Fetching menu');
    // ... ...
  } catch (error: any) {
    log.error({ error, endpoint: '/api/menu' }, 'Error fetching menu');
    res.status(500).json({ error: error.message });
  }
});
```

---

### 8. Gestion d'Erreur Centralisée
**Problème**: Erreurs gérées de manière inconsistante  
**Gain**: Meilleure expérience utilisateur

```typescript
// Middleware de gestion d'erreur
app.use((err: any, req: any, res: any, next: any) => {
  // Logger l'erreur
  req.log.error(err);
  
  // Erreurs CORS
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'Origin not allowed',
      message: 'This domain is not authorized to access the API'
    });
  }
  
  // Erreurs de validation
  if (err.name === 'ZodError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.errors 
    });
  }
  
  // Erreurs de base de données
  if (err.code && err.code.startsWith('23')) { // PostgreSQL error codes
    return res.status(500).json({ 
      error: 'Database error',
      message: 'Unable to process your request'
    });
  }
  
  // Erreur par défaut
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

---

## 📊 Plan d'Implémentation

### Phase 1 (Cette semaine):
1. ✅ Déployer CORS en production
2. ✅ Corriger la connexion PostgreSQL
3. ⬜ Ajouter Health Check endpoint
4. ⬜ Implémenter le logging structuré

### Phase 2 (Semaine prochaine):
5. ⬜ Configurer le cache Redis
6. ⬜ Ajouter le rate limiting
7. ⬜ Implémenter la validation des entrées
8. ⬜ Connection pooling PostgreSQL

### Phase 3 (Long terme):
9. ⬜ Compression des réponses
10. ⬜ Monitoring avancé (Prometheus/Grafana)
11. ⬜ Tests de charge
12. ⬜ Documentation OpenAPI/Swagger

---

## 🔧 Dépendances à Installer

```bash
npm install \
  ioredis \
  express-rate-limit \
  compression \
  zod \
  pino \
  pino-http
```

---

## 📞 Ressources

- **Performance**: https://expressjs.com/en/advanced/best-practice-performance.html
- **Sécurité**: https://expressjs.com/en/advanced/best-practice-security.html
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview

---

**Priorité**: Commencer par le déploiement CORS en production! 🔥
