# 🔐 Accès Admin - Sam Pizza

**Date de mise à jour**: 13 avril 2026
**Statut**: ✅ Fonctionnel

---

## 🔑 Identifiants de Connexion

### URL Admin
```
https://sam-pizza.mgd-crm.com/admin
```

### Mot de passe
```
SamPizza2024!Admin
```

---

## 📋 Utilisation

### 1. Connexion
1. Naviguer vers `https://sam-pizza.mgd-crm.com/admin`
2. Entrer le mot de passe: `SamPizza2024!Admin`
3. Cliquer sur "Se connecter"

### 2. Fonctionnalités disponibles
Une fois connecté, vous avez accès à:
- 📊 **Tableau de bord** - Statistiques de ventes
- 📝 **Gestion des commandes** - Voir et modifier les statuts
- 🍕 **Gestion du menu** - Ajouter/modifier/supprimer des produits
- ⚙️ **Configuration** - Paramètres de l'application

---

## 🔧 Configuration Technique

### Variable d'environnement
Le mot de passe admin est configuré via la variable:
```env
ADMIN_PASSWORD=SamPizza2024!Admin
```

### Fichier de configuration
- Localisation: `.env` à la racine du projet
- Services: API (port 3004) et App (port 3005)

---

## 🐛 Dépannage

### Mot de passe ne fonctionne pas
1. Vérifier que les services tournent:
   ```bash
   ssh root@109.123.249.114
   pm2 list
   ```

2. Vérifier la variable d'environnement:
   ```bash
   pm2 env 0 | grep ADMIN_PASSWORD
   ```

3. Redémarrer les services si nécessaire:
   ```bash
   pm2 restart all
   ```

### Page admin inaccessible
1. Vérifier l'URL: `https://sam-pizza.mgd-crm.com/admin`
2. Vider le cache du navigateur
3. Vérifier les logs: `pm2 logs`

---

## 📞 Support

En cas de problème:
- Consulter: `DEPLOYMENT.md`
- Vérifier les logs API: `pm2 logs sam-pizza-api`
- Contacter l'équipe backend

---

**Note**: Ces identifiants sont destinés à un usage interne et administratif uniquement.
