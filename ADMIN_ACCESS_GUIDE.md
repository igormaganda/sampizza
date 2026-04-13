# 🔐 Guide d'Accès Admin - Sam Pizza

**Date de mise à jour**: 2026-04-13  
**Statut**: ⚠️ **PARTIELLEMENT CONFIGURÉ**

---

## 🔑 Identifiants Admin

### Accès Frontend
- **URL Admin**: https://sam-pizza.mgd-crm.com/admin
- **Mot de passe**: `SamPizza2024!Admin`

### Accès API
- **Login Endpoint**: `POST /api/admin/login`
- **Stats Endpoint**: `GET /api/admin/stats`
- **Password**: `SamPizza2024!Admin`

---

## ⚠️ Problème Identifié

### Configuration Admin Non Déployée en Production

**Test effectué**:
```bash
curl -X POST https://sam-pizza.mgd-crm.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"SamPizza2024!Admin"}'
```

**Résultat**:
```json
{
  "success": false,
  "error": "Configuration serveur manquante (ADMIN_PASSWORD)"
}
```

**Conclusion**: La variable d'environnement `ADMIN_PASSWORD` n'est PAS configurée sur le serveur de production.

---

## ✅ Ce qui Fonctionne

- ✅ Le site frontend est accessible
- ✅ L'endpoint `/api/admin/stats` retourne des données (mais SANS authentification!)
- ✅ Les commandes sont accessibles via `/api/orders`

---

## 🚨 Risques de Sécurité

### RISQUE CRITIQUE: Endpoint Admin Non Sécurisé

L'endpoint `/api/admin/stats` est accessible **SANS authentification**!

**Preuve**:
```bash
curl https://sam-pizza.mgd-crm.com/api/admin/stats
# Retourne des données SANS vérifier le mot de passe!
```

**Impact**:
- N'importe qui peut accéder aux statistiques de vente
- Données financières exposées publiquement
- Violation de la sécurité et de la confidentialité

---

## 🎯 Actions Requises

### IMMÉDIAT (Priorité Critique)

1. **Configurer ADMIN_PASSWORD en production**
   ```bash
   # Sur le serveur de production
   export ADMIN_PASSWORD=SamPizza2024!Admin
   # OU dans .env:
   echo "ADMIN_PASSWORD=SamPizza2024!Admin" >> .env
   ```

2. **Redémarrer le serveur**
   ```bash
   pm2 restart sam-pizza-api
   ```

3. **Ajouter l'authentification sur /api/admin/stats**
   
   **Code actuel (server.ts:296)**:
   ```typescript
   app.get('/api/admin/stats', async (req, res) => {
     // PAS DE VÉRIFICATION D'AUTHENTIFICATION!
   ```
   
   **Code corrigé**:
   ```typescript
   app.get('/api/admin/stats', async (req, res) => {
     // Vérifier l'authentification
     const authHeader = req.headers.authorization;
     if (authHeader !== 'Bearer admin-token-xyz') {
       return res.status(401).json({ error: 'Non autorisé' });
     }
     // ... suite du code
   ```

---

## 📋 Tests de Validation

### Test 1: Connexion Admin
```bash
curl -X POST https://sam-pizza.mgd-crm.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"SamPizza2024!Admin"}'
```

**Attendu**: `{"success": true, "token": "admin-token-xyz"}`

### Test 2: Accès Stats (SANS auth)
```bash
curl https://sam-pizza.mgd-crm.com/api/admin/stats
```

**Attendu**: `401 Unauthorized` (pas de données!)

### Test 3: Accès Stats (AVEC auth)
```bash
curl https://sam-pizza.mgd-crm.com/api/admin/stats \
  -H "Authorization: Bearer admin-token-xyz"
```

**Attendu**: Données statistiques

---

## 🔐 Recommandations de Sécurité

1. **Implémenter un vrai système d'authentification**
   - Utiliser JWT (JSON Web Tokens)
   - Expiration des tokens
   - Refresh tokens

2. **Ajouter rate limiting**
   - Limiter les tentatives de login
   - Bloquer après 5 échecs

3. **Logger les tentatives d'accès**
   - Succès et échecs
   - Adresse IP
   - Timestamp

4. **Utiliser HTTPS**
   - HTTPS déjà activé ✅
   - Forcer la redirection HTTP→HTTPS

5. **Masquer les données sensibles**
   - Ne pas exposer les détails des commandes publiquement
   - Anonymiser les données dans les logs

---

## 📚 Documentation Backend

### Endpoints Admin Disponibles

#### POST /api/admin/login
**Description**: Authentification admin  
**Requête**: `{"password": "SamPizza2024!Admin"}`  
**Réponse**: `{"success": true, "token": "admin-token-xyz"}`

#### GET /api/admin/stats
**Description**: Statistiques de vente  
**Authentification**: Requise (Bearer token)  
**Réponse**: 
```json
{
  "totalRevenue": 0,
  "totalOrders": 0,
  "recentOrders": [],
  "chartData": []
}
```

#### GET /api/orders
**Description**: Liste de toutes les commandes  
**Authentification**: Requise (devrait l'être!)  
**Réponse**: Array de commandes

#### PUT /api/orders/:id/status
**Description**: Modifier le statut d'une commande  
**Authentification**: Requise (devrait l'être!)  
**Requête**: `{"status": "en_cours"}`

---

## 🚀 Prochaines Étapes

1. Configurer `ADMIN_PASSWORD` en production
2. Ajouter l'authentification sur tous les endpoints admin
3. Implémenter JWT pour une vraie authentification
4. Ajouter rate limiting et logging
5. Tests de pénétration

---

## 📞 Support

**Problèmes d'accès**: Contacter l'équipe backend  
**Questions d'utilisation**: Voir la documentation admin

**Statut**: ⚠️ **ATTENTE CONFIGURATION PRODUCTION**