# 🚀 Guide de Déploiement Complet - Sam Pizza

## 📋 Vue d'ensemble

Ce guide coordonne le déploiement du **frontend** (React) et du **backend** (API Node.js/Express) après les corrections critiques apportées.

---

## ✅ Corrections Appliquées

### Frontend (Agent FRONTEND)
- ✅ URLs API hardcoded remplacées par des chemins relatifs (`/api/*`)
- ✅ Fichier `.htaccess` créé pour le SPA routing Apache
- ✅ Documentation Apache créée (`APACHE_CONFIG.md`)

### Backend (Agent BACKEND)
- ✅ Configuration CORS implémentée avec origins autorisés
- ✅ Documentation déploiement créée (`DEPLOYMENT.md`)
- ✅ Build validé et prêt pour production

---

## 🎯 Architecture de Déploiement

### Serveur: 109.123.249.114 (Ubuntu)

```
┌─────────────────────────────────────────┐
│           Serveur Apache                │
│  https://sam-pizza.mgd-crm.com          │
│  Port 80/443                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Frontend (React)                │  │
│  │  - Fichiers statiques (dist/)    │  │
│  │  - .htaccess (SPA routing)       │  │
│  │  - /admin → BackOffice           │  │
│  │  - /tracking → OrderTracking     │  │
│  │  - / → FrontOffice               │  │
│  └──────────────────────────────────┘  │
│                 ↓                       │
│  ┌──────────────────────────────────┐  │
│  │  API Proxy /api/*                │  │
│  │  → Redirige vers backend         │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│       Backend API (Node.js/Express)     │
│  Port 3004 (interne)                    │
│  - /api/menu                            │
│  - /api/orders                          │
│  - /api/create-checkout-session         │
│  - CORS configuré                        │
│  - Stripe webhooks                      │
└─────────────────────────────────────────┘
```

---

## 🚀 Procédure de Déploiement Complète

### Étape 1: Préparation Locale

```bash
# 1. Se placer dans le répertoire du projet
cd C:\Users\Administrator\Documents\test\Pizza

# 2. S'assurer que toutes les dépendances sont installées
npm install

# 3. Build complet (frontend + backend)
npm run build

# 4. Vérifier que le build a réussi
# - Le dossier dist/ doit contenir les fichiers compilés
# - Aucune erreur TypeScript
```

### Étape 2: Déploiement Frontend (Apache)

```bash
# 1. Transférer les fichiers build sur le serveur
scp -r dist/* user@109.123.249.114:/var/www/sam-pizza/public/

# 2. Transférer le fichier .htaccess CRUCIAL pour le SPA routing
scp public/.htaccess user@109.123.249.114:/var/www/sam-pizza/public/

# 3. SSH sur le serveur
ssh user@109.123.249.114

# 4. Vérifier les permissions
sudo chown -R www-data:www-data /var/www/sam-pizza/public/
sudo chmod -R 755 /var/www/sam-pizza/public/

# 5. Vérifier que .htaccess est présent
ls -la /var/www/sam-pizza/public/.htaccess
```

### Étape 3: Configuration Apache (Si nécessaire)

Si le fichier `.htaccess` ne suffit pas, configurer le Virtual Host:

```bash
# Sur le serveur
sudo nano /etc/apache2/sites-available/sam-pizza.conf
```

Copier la configuration depuis `APACHE_CONFIG.md` puis:

```bash
# Activer le site
sudo a2ensite sam-pizza.conf

# Activer les modules requis
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate

# Redémarrer Apache
sudo systemctl restart apache2
```

### Étape 4: Déploiement Backend (API)

```bash
# Sur le serveur (ou transférer les fichiers build)
cd /var/www/sam-pizza-api

# Si le code backend a changé:
git pull origin main
npm install --production
npm run build

# Redémarrer le service
pm2 restart sam-pizza-api

# Ou si pas de PM2:
NODE_ENV=production node server.ts
```

### Étape 5: Configuration Proxy Apache (Optionnel)

Si Apache doit proxy les requêtes API vers le backend:

```apache
# Dans /etc/apache2/sites-available/sam-pizza.conf
<Location /api>
    ProxyPass http://localhost:3004/api
    ProxyPassReverse http://localhost:3004/api
</Location>
```

---

## ✅ Tests de Validation

### 1. Test Frontend

```bash
# Test navigation directe (CRITIQUE pour SPA routing)
curl -I https://sam-pizza.mgd-crm.com/admin
# Doit retourner 200 OK (pas 404)

curl -I https://sam-pizza.mgd-crm.com/tracking
# Doit retourner 200 OK

# Test home
curl -I https://sam-pizza.mgd-crm.com/
# Doit retourner 200 OK
```

### 2. Test API

```bash
# Test CORS
curl -H "Origin: https://sam-pizza.mgd-crm.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://apisam.mgd-crm.com/api/menu

# Doit retourner 204 No Content avec headers CORS

# Test endpoint menu
curl https://apisam.mgd-crm.com/api/menu
# Doit retourner JSON avec menuItems et configOptions
```

### 3. Test Navigation Manuelle

Ouvrir un navigateur et tester:

1. **Home page**: https://sam-pizza.mgd-crm.com
   - Doit afficher FrontOffice avec les pizzas

2. **Admin direct**: https://sam-pizza.mgd-crm.com/admin
   - Doit afficher BackOffice (pas de 404!)
   - Rafraîchir (F5) - doit fonctionner

3. **Tracking**: https://sam-pizza.mgd-crm.com/tracking
   - Doit afficher OrderTracking
   - Rafraîchir (F5) - doit fonctionner

---

## 🔧 Résolution de Problèmes

### Problème: /admin retourne 404

**Cause**: Apache ne redirige pas vers index.html

**Solution**:
1. Vérifier que `.htaccess` est présent: `ls -la /var/www/sam-pizza/public/.htaccess`
2. Vérifier `AllowOverride All` dans la config Apache
3. Redémarrer Apache: `sudo systemctl restart apache2`

### Problème: API retourne erreur CORS

**Cause**: Backend CORS mal configuré

**Solution**:
1. Vérifier les logs: `pm2 logs sam-pizza-api`
2. Vérifier que le frontend URL est dans `allowedOrigins`
3. Redémarrer le backend: `pm2 restart sam-pizza-api`

### Problème: Produits ne s'affichent pas

**Cause**: URLs API incorrectes ou backend down

**Solution**:
1. Ouvrir la console navigateur (F12)
2. Vérifier les erreurs réseau
3. Tester l'API directement: `curl https://apisam.mgd-crm.com/api/menu`
4. Vérifier que les URLs sont relatives (`/api/menu` et pas `https://apisam.mgd-crm.com/api/menu`)

---

## 📊 Checklist de Déploiement

### Pré-déploiement
- [ ] Build local réussi (`npm run build`)
- [ ] Tests locaux passent
- [ ] Fichiers `.htaccess` et `APACHE_CONFIG.md` prêts
- [ ] Configuration CORS vérifiée

### Déploiement Frontend
- [ ] Fichiers `dist/*` transférés sur le serveur
- [ ] Fichier `.htaccess` transféré dans `public/`
- [ ] Permissions fichiers correctes (`www-data:www-data`)
- [ ] Apache redémarré
- [ ] Test navigation directe `/admin` fonctionne

### Déploiement Backend
- [ ] Code backend à jour sur le serveur
- [ ] `npm install --production` exécuté
- [ ] Service API redémarré (PM2 ou systemd)
- [ ] Tests API passent (`/api/menu`, `/api/orders`)
- [ ] CORS fonctionnel

### Post-déploiement
- [ ] Test navigation complète (home, admin, tracking)
- [ ] Test création commande
- [ ] Test paiement Stripe (si activé)
- [ ] Surveillance logs (24h)
- [ ] Vérifier metrics (uptime, erreurs)

---

## 🔐 Sécurité

- [ ] HTTPS activé avec certificat SSL valide
- [ ] Headers sécurité configurés (HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting API actif
- [ ] Admin password fort et unique
- [ ] Variables environnement sécurisées (jamais commitées)
- [ ] Webhooks Stripe vérifiés avec signature

---

## 📞 Support et Contact

En cas de problème:

1. **Frontend**: Consulter `APACHE_CONFIG.md`
2. **Backend**: Consulter `DEPLOYMENT.md`
3. **Logs**: `pm2 logs sam-pizza-api` et `/var/log/apache2/error.log`
4. **Tests**: Utiliser les commandes de test ci-dessus

**Équipe de développement**:
- Frontend: Agent FRONTEND (React/TypeScript)
- Backend: Agent BACKEND (Node.js/Express)
- Support: `#support-diagnostics`

---

## 📝 Notes de Version

### Version 1.0 - Corrections Critiques

**Frontend**:
- Correction URLs API hardcoded → chemins relatifs
- Ajout configuration Apache pour SPA routing
- Documentation complète déploiement Apache

**Backend**:
- Configuration CORS avec origins autorisés
- Documentation déploiement backend
- Build validé pour production

**Impact**:
- ✅ Routing React (`/admin`, `/tracking`) fonctionne maintenant
- ✅ Appels API utilisent des URLs relatives (dev + prod)
- ✅ CORS configuré correctement
- ✅ Déploiement simplifié et documenté

---

**Date**: 2026-04-12  
**Statut**: ✅ PRÊT POUR DÉPLOIEMENT
