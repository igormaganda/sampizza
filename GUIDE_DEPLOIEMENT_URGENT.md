# 🚨 GUIDE DE DÉPLOIEMENT URGENT - CORS

**Date**: 13 avril 2026
**Priorité**: MAXIMALE
**Durée estimée**: 15 minutes
**Impact**: Débloquer le frontend et les commandes clients

---

## 📋 SITUATION ACTUELLE

### Problème
Le frontend ne peut pas appeler l'API car **CORS n'est pas activé** en production.

### Symptômes
- Page blanche ou produits invisibles
- Erreurs console CORS dans le navigateur
- Les clients ne peuvent pas commander

### Solution
Déployer le code backend modifié avec CORS sur le serveur de production.

---

## 🎯 PLAN D'ACTION

### Option 1: Déploiement Automatisé (RECOMMANDÉ)

Si vous pouvez exécuter des scripts bash sur votre machine:

```bash
# 1. Rendre le script exécutable
chmod +x DEPLOY_PRODUCTION.sh

# 2. Exécuter le déploiement
./DEPLOY_PRODUCTION.sh
```

**Le script fera automatiquement:**
- ✅ Vérifier la connexion SSH
- ✅ Mettre à jour le code sur le serveur
- ✅ Rebuild l'application
- ✅ Redémarrer les services
- ✅ Vérifier le déploiement

---

### Option 2: Déploiement Manuel Pas à Pas

Si vous préférez contrôler chaque étape:

#### ÉTAPE 1: Connexion au serveur

```bash
# Remplacer par vos identifiants si nécessaire
ssh root@109.123.249.114
```

**Si connexion refusée:**
- Vérifier vos identifiants SSH
- Accepter la clé host si demandé

---

#### ÉTAPE 2: Naviguer vers le projet API

```bash
# Le répertoire peut varier - vérifier le bon chemin
cd /var/www/sam-pizza-api
# OU
cd /home/user/sam-pizza
# OU
cd /var/www/html/sam-pizza
```

**Comment trouver le bon répertoire:**
```bash
# Chercher les fichiers server.ts ou package.json
find / -name "server.ts" -type f 2>/dev/null
# OU
find / -name "package.json" -type f 2>/dev/null | grep pizza
```

---

#### ÉTAPE 3: Mettre à jour le code

```bash
# Vérifier l'état actuel
git status

# Récupérer le dernier code
git pull origin main

# Si erreur, essayer:
git fetch origin
git reset --hard origin/main
```

---

#### ÉTAPE 4: Rebuild l'application

```bash
# Installer les dépendances (si nécessaire)
npm install

# Build l'application
npm run build

# Vérifier que le build a réussi
ls -la dist/
```

**Attendu:** Le fichier `dist/server.cjs` doit exister

---

#### ÉTAPE 5: Redémarrer le service

**Option A: Avec PM2 (recommandé)**
```bash
# Vérifier les processus
pm2 list

# Redémarrer l'API
pm2 restart sam-pizza-api

# Vérifier que ça tourne
pm2 logs sam-pizza-api --lines 20
```

**Option B: Avec systemd**
```bash
# Redémarrer le service
systemctl restart sam-pizza-api

# Vérifier le statut
systemctl status sam-pizza-api

# Voir les logs
journalctl -u sam-pizza-api -f
```

**Option C: Manuel**
```bash
# Tuer l'ancien processus
pkill -f "node.*server"

# Démarrer le nouveau
NODE_ENV=production nohup node dist/server.cjs > /tmp/pizzeria-api.log 2>&1 &
```

---

#### ÉTAPE 6: Vérifier le déploiement

```bash
# Quitter le serveur (ou dans un autre terminal)
exit

# Tester l'API depuis votre machine
curl -I https://apisam.mgd-crm.com/api/menu | grep -i "access-control"

# Attendu: Doit afficher les headers CORS
# Access-Control-Allow-Origin: https://sam-pizza.mgd-crm.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

**Si les headers CORS sont présents = SUCCÈS !**

---

#### ÉTAPE 7: Tester le frontend

1. Ouvrir: https://sam-pizza.mgd-crm.com/
2. Ouvrir la console du navigateur (F12)
3. Vérifier que les produits s'affichent
4. Vérifier qu'il n'y a pas d'erreurs CORS

---

## 🔐 ACCÈS ADMIN (DISPONIBLE)

Pour tester l'interface d'administration après déploiement:

**URL Admin**: `https://sam-pizza.mgd-crm.com/admin`  
**Mot de passe**: `SamPizza2024!Admin`

Documentation détaillée: `ADMIN_ACCESS.md`

---

## ✅ CRITÈRES DE VALIDATION

Le déploiement est réussi si:

- [ ] L'API répond avec un status 200
- [ ] Les headers CORS sont présents
- [ ] Le frontend affiche les 7 produits
- [ ] Aucune erreur CORS dans la console
- [ ] Les clients peuvent commander

---

## 🐛 DÉBOGAGE

### Si le build échoue

```bash
# Vérifier les erreurs
npm run build 2>&1 | tee build.log

# Vérifier Node.js version
node --version  # Doit être 18+

# Nettoyer et réessayer
rm -rf node_modules dist
npm install
npm run build
```

### Si PM2 ne trouve pas le processus

```bash
# Lister tous les processus
pm2 list

# Ajouter le processus si manquant
pm2 start dist/server.cjs --name sam-pizza-api

# Sauvegarder la configuration
pm2 save
```

### Si l'API ne répond pas

```bash
# Vérifier les logs
pm2 logs sam-pizza-api

# Vérifier les ports
lsof -i :3004

# Vérifier le firewall
ufw status

# Tester localement sur le serveur
curl http://localhost:3004/api/menu
```

### Si CORS ne fonctionne toujours pas

```bash
# Vérifier le code déployé
grep -A 10 "app.use(cors" dist/server.cjs

# Si pas de CORS, le code n'a pas été mis à jour
# Vérifier le git pull et refaire le build
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes:

1. **Vérifier les logs** du serveur
2. **Consulter la documentation**:
   - `DEPLOYMENT.md` - Guide complet
   - `CORS_DEPLOYMENT_STATUS.md` - État actuel
   - `API_HEALTH_REPORT.md` - Rapport backend

3. **Contact**:
   - Backend API: Vérifier la configuration serveur
   - DevOps: Vérifier l'accès et les permissions
   - Support: Tests et validation

---

## 🎯 PROCHAINE ACTION

Une fois le déploiement réussi:

1. ✅ Tester le frontend complètement
2. ✅ Tester un parcours client complet
3. ✅ Vérifier les paiements Stripe
4. ✅ Surveiller les logs pendant 1 heure

---

**Bonne chance ! Le succès de cette opération est critique pour l'activité.** 🍕💪

Documentation créée par l'agent DEVOPS - Sam Pizza Team
