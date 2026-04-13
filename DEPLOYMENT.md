# 🍕 Sam Pizza - Guide de Déploiement Backend API

## 📋 Architecture Actuelle

### Serveurs
- **Main App**: Port 3005 → `https://sam-pizza.mgd-crm.com`
- **API Service**: Port 3004 → `https://apisam.mgd-crm.com`
- **Database**: PostgreSQL (sampaizza/sampaizza_user)

### Technologies
- Node.js + Express.js + TypeScript
- PostgreSQL avec Drizzle ORM
- Stripe API (paiements)
- Vite (dev server)

---

## 🚀 Procédure de Build & Déploiement

### 1. Prérequis
```bash
# Node.js installé
node --version  # v18+

# Dependencies installées
npm install
```

### 2. Configuration Environment
Créer/copier le fichier `.env`:
```env
# Database Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=sampaizza
PGUSER=sampaizza_user
PGPASSWORD=your_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin Configuration
ADMIN_PASSWORD=secure_password

# Application Configuration
APP_URL=https://sam-pizza.mgd-crm.com
NODE_ENV=production
PORT=3000
```

### 3. Build Production
```bash
# Build frontend + backend
npm run build

# Ou si script séparé:
npm run build:frontend
npm run build:backend
```

### 4. Base de Données
```bash
# Lancer les migrations Drizzle
npm run db:push

# Ou migrer manuellement:
npm run db:migrate
```

### 5. Démarrage du Serveur
```bash
# Production mode
NODE_ENV=production node server.ts

# Ou avec PM2 (recommandé):
pm2 start server.ts --name sam-pizza-api
pm2 save
pm2 startup
```

---

## 🔒 Configuration CORS

### Origins Autorisés
```typescript
const allowedOrigins = [
  'https://sam-pizza.mgd-crm.com',  // Frontend principal
  'https://apisam.mgd-crm.com',     // API publique
  'http://localhost:3000',          // Dev local
  'http://localhost:3005',          // Dev local alt
];
```

### Méthodes HTTP Autorisées
- `GET` - Récupération données (menu, commandes)
- `POST` - Création (commandes, checkout sessions)
- `PUT` - Mises à jour (status commandes, menu items)
- `DELETE` - Suppression (menu items)
- `OPTIONS` - Preflight CORS

### Headers Autorisés
- `Content-Type`
- `Authorization`
- `X-Requested-With`

---

## 🛠️ API Endpoints

### Public
- `GET /api/menu` - Liste des produits
- `POST /api/orders` - Créer commande (sans paiement)
- `POST /api/create-checkout-session` - Paiement Stripe

### Admin (avec password)
- `POST /api/admin/login` - Authentification
- `GET /api/admin/stats` - Statistiques ventes
- `PUT /api/orders/:id/status` - Modifier statut commande

### Webhooks
- `POST /api/webhook` - Stripe webhook (doit être avant express.json)

---

## 🔧 Maintenance

### Logs
```bash
# PM2 logs
pm2 logs sam-pizza-api

# Ou logs fichier
tail -f /var/log/sam-pizza/app.log
```

### Redémarrage
```bash
# Redémarrage propre
pm2 restart sam-pizza-api

# Ou rolling restart (zero downtime)
pm2 reload sam-pizza-api
```

### Mises à jour
```bash
# Pull code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart service
pm2 restart sam-pizza-api
```

---

## 🐛 Debugging

### Vérifier CORS
```bash
# Test API endpoint
curl -H "Origin: https://sam-pizza.mgd-crm.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://apisam.mgd-crm.com/api/menu
```

### Vérifier Base de Données
```bash
# Connecter PostgreSQL
psql -U sampaizza_user -d sampaizza

# Vérifier tables
\dt
SELECT * FROM menu_items;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
```

### Vérifier Stripe
```bash
# Lister les webhooks Stripe
stripe webhooks list

# Vérifier dernier événement
stripe events list --limit 1
```

---

## 📊 Monitoring

### Health Check
- Ajouter endpoint `GET /api/health` pour monitoring
- Vérifier: status DB, connexion Stripe, mémoire

### Alertes
- Erreurs API → Notification équipe
- Webhooks Stripe échouent → Alert immédiate
- Disponibilité < 99% → Alert critique

---

## 🔐 Sécurité

### En Production
- [ ] HTTPS activé (certificat SSL)
- [ ] Rate limiting configuré
- [ ] Sanitization inputs utilisateur
- [ ] Variables environnement sécurisées
- [ ] Webhooks Stripe vérifiés
- [ ] Admin password fort

### Backup
- Backup DB quotidien (automatisé)
- Logs retenus 30 jours
- Code versionné (git)

---

## 📞 Support

En cas de problème:
1. Vérifier logs PM2
2. Tester API directement (curl)
3. Vérifier connexion DB
4. Vérifier statut Stripe (status.stripe.com)

**Contact backend**: Utiliser le canal `#backend-support` sur Discord/Slack
