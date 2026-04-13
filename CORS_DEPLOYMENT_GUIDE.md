# 🚀 Guide de Déploiement CORS - Instructions pour DevOps

**Priorité**: CRITIQUE  
**Délai**: IMMÉDIAT  
**Impact**: Débloque le frontend et les utilisateurs

---

## 📋 Contexte

Le code CORS est **PRÊT** dans le repository local mais n'a pas été déployé en production. Cela bloque le frontend qui ne peut pas appeler l'API.

---

## 🎯 Objectif

Déployer les modifications CORS sur le serveur de production pour permettre au frontend de communiquer avec l'API.

---

## 📦 Contenu du Déploiement

### Fichiers Modifiés

1. **`server.ts`** (2 modifications)
   - Ajout: `import cors from 'cors'`
   - Ajout: Middleware CORS configuré après `express.json()`

### Configuration CORS

```typescript
// Origins autorisés:
const allowedOrigins = [
  'https://sam-pizza.mgd-crm.com',  // Frontend principal
  'https://apisam.mgd-crm.com',     // API publique
  'http://localhost:3000',          // Dev local
  'http://localhost:3005',          // Dev local
];

// Méthodes autorisées:
['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

// Headers autorisés:
['Content-Type', 'Authorization', 'X-Requested-With']
```

---

## 🔧 Instructions de Déploiement

### Option 1: Déploiement depuis le Repository (Recommandé)

```bash
# 1. Connecter au serveur de production
ssh user@apisam.mgd-crm.com

# 2. Naviguer vers le répertoire du projet
cd /var/www/sam-pizza-api  # ou le chemin approprié

# 3. Récupérer le dernier code
git pull origin main

# 4. Installer les dépendances si nécessaire
npm install

# 5. Build de l'application
npm run build

# 6. Redémarrer le service
pm2 restart sam-pizza-api
# OU
systemctl restart sam-pizza-api
```

### Option 2: Déploiement Manuel via Package

Si le repository git n'est pas configuré sur le serveur:

```bash
# 1. Transférer le package existant
scp sam-pizza-deploy-20260413-125611.tar.gz user@apisam.mgd-crm.com:/tmp/

# 2. Sur le serveur
ssh user@apisam.mgd-crm.com
cd /var/www/sam-pizza-api
tar -xzf /tmp/sam-pizza-deploy-20260413-125611.tar.gz

# 3. Copier les fichiers modifiés
cp server.ts /var/www/sam-pizza-api/
cp -r dist /var/www/sam-pizza-api/

# 4. Redémarrer
pm2 restart sam-pizza-api
```

---

## ✅ Tests de Validation

### Test 1: Vérifier les Headers CORS

```bash
curl -I https://apisam.mgd-crm.com/api/menu
```

**Attendu**:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://sam-pizza.mgd-crm.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Vary: Origin
```

### Test 2: Test CORS Preflight

```bash
curl -X OPTIONS https://apisam.mgd-crm.com/api/menu \
  -H "Origin: https://sam-pizza.mgd-crm.com" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Attendu**: Headers CORS présents dans la réponse

### Test 3: Vérifier que l'API Fonctionne

```bash
curl https://apisam.mgd-crm.com/api/menu
```

**Attendu**: JSON avec 7 produits

---

## 🚨 En Cas de Problème

### Problème: Build échoue

**Solution**:
```bash
# Vérifier les dépendances
npm install

# Vérifier TypeScript
npm run build

# Si erreur de compilation, vérifier server.ts
```

### Problème: Service ne démarre pas

**Solution**:
```bash
# Vérifier les logs
pm2 logs sam-pizza-api

# Redémarrer
pm2 restart sam-pizza-api

# Si problème persiste
pm2 delete sam-pizza-api
pm2 start server.ts --name sam-pizza-api
```

### Problème: Headers CORS absents

**Solution**:
```bash
# Vérifier que le code a bien été déployé
grep -n "cors" server.ts

# Vérifier le build
grep -n "cors" dist/server.cjs

# Si absent, rebuild
npm run build
pm2 restart sam-pizza-api
```

---

## 📊 Validation Finale

Une fois le déploiement effectué:

1. **Tester le frontend**
   - Aller sur: https://sam-pizza.mgd-crm.com
   - Vérifier que les produits s'affichent
   - Ouvrir la console navigateur (F12)
   - Vérifier qu'il n'y a pas d'erreurs CORS

2. **Tester l'API**
   ```bash
   curl https://apisam.mgd-crm.com/api/menu
   ```

3. **Vérifier les logs**
   ```bash
   pm2 logs sam-pizza-api --lines 50
   ```

---

## 🎯 Critères de Succès

Le déploiement est considéré comme **RÉUSSI** lorsque:

- ✅ Les headers CORS sont présents dans les réponses API
- ✅ Le frontend peut charger les produits sans erreurs CORS
- ✅ Les utilisateurs peuvent naviguer sur le site
- ✅ La console navigateur n'affiche pas d'erreurs

---

## 📞 Support

**En cas de problème**:
- Backend-API: Disponible pour questions techniques
- Documentation: `DEPLOYMENT.md`, `CORS_DEPLOYMENT_STATUS.md`
- Tests: `API_HEALTH_REPORT.md`

---

## ⏱️ Estimation Temps

- Déploiement: 5-10 minutes
- Tests validation: 5 minutes
- **Total**: 15 minutes maximum

---

## 🚀 Prêt à Déployer

Le code est **PRÊT** et **TESTÉ** localement. Le déploiement en production est la seule étape restante.

**Priorité**: MAXIMALE - Bloquant pour les utilisateurs

**Statut**: ⏸️ **ATTENTE DÉPLOIEMENT DEVOPS**