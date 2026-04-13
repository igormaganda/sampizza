# Configuration Apache pour Sam Pizza - SPA React

## 📋 Vue d'ensemble

Ce document explique comment configurer le serveur Apache pour héberger l'application React Sam Pizza avec un routing correct.

## 🚨 Problème

Par défaut, Apache ne connaît pas le routing client-side de React. Lorsqu'un utilisateur accède à:
- `https://sam-pizza.mgd-crm.com/admin`
- `https://sam-pizza.mgd-crm.com/tracking/123`

Apache cherche un fichier physique `/admin` ou `/tracking/123` qui n'existe pas, et retourne une erreur 404.

## ✅ Solution

Le fichier `.htaccess` dans le dossier `public/` redirige toutes les requêtes vers `index.html` (sauf API et assets), permettant à React Router de gérer le routing.

## 📁 Fichiers

### 1. `.htaccess` (Déjà créé)
Location: `public/.htaccess`

Ce fichier contient:
- ✅ Redirection SPA vers index.html
- ✅ Exclusion des routes API (/api/*)
- ✅ Exclusion des fichiers statiques
- ✅ Compression et cache
- ✅ Headers CORS
- ✅ Security headers

### 2. Virtual Host Apache (À configurer sur le serveur)

Si le fichier `.htaccess` ne fonctionne pas, vous pouvez configurer directement le Virtual Host Apache:

```apache
<VirtualHost *:80>
    ServerName sam-pizza.mgd-crm.com
    DocumentRoot /var/www/sam-pizza/public

    <Directory /var/www/sam-pizza/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA Fallback
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteRule . /index.html [L]
    </Directory>

    # API Proxy (si nécessaire)
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    ErrorLog ${APACHE_LOG_DIR}/sam-pizza-error.log
    CustomLog ${APACHE_LOG_DIR}/sam-pizza-access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName sam-pizza.mgd-crm.com
    DocumentRoot /var/www/sam-pizza/public

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    <Directory /var/www/sam-pizza/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA Fallback
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteRule . /index.html [L]
    </Directory>

    # API Proxy (si nécessaire)
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    ErrorLog ${APACHE_LOG_DIR}/sam-pizza-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/sam-pizza-ssl-access.log combined
</VirtualHost>
```

## 🔧 Installation sur le serveur

### Option 1: Utiliser .htaccess (Recommandé pour début)

1. Copier le fichier `.htaccess` dans le dossier `public/` du déploiement:
```bash
scp public/.htaccess user@109.123.249.114:/var/www/sam-pizza/public/
```

2. S'assurer que `AllowOverride` est activé dans la config Apache:
```apache
<Directory /var/www/sam-pizza/public>
    AllowOverride All
</Directory>
```

3. Redémarrer Apache:
```bash
sudo systemctl restart apache2
```

### Option 2: Configuration Virtual Host Directe

1. Créer le fichier de configuration:
```bash
sudo nano /etc/apache2/sites-available/sam-pizza.conf
```

2. Copier la configuration Virtual Host ci-dessus

3. Activer le site et les modules:
```bash
sudo a2ensite sam-pizza.conf
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo systemctl restart apache2
```

## ✅ Tests de validation

### 1. Test local
```bash
npm run dev
# Aller sur http://localhost:5173/admin
# Devrait afficher le back-office
```

### 2. Test production
```bash
# Sur le serveur
curl -I https://sam-pizza.mgd-crm.com/admin
# Devrait retourner 200 OK (pas 404)
```

### 3. Test navigation directe
- Ouvrir https://sam-pizza.mgd-crm.com/admin directement (pas depuis la home)
- Devrait afficher le back-office
- Rafraîchir la page (F5) - devrait fonctionner

## 🔍 Debug

Si le routing ne fonctionne toujours pas:

1. Vérifier les logs Apache:
```bash
tail -f /var/log/apache2/error.log
```

2. Vérifier que mod_rewrite est activé:
```bash
sudo apache2ctl -M | grep rewrite
```

3. Tester les règles de réécriture:
```bash
sudo apachectl -t -D DUMP_VHOSTS
```

4. Vérifier les permissions:
```bash
ls -la /var/www/sam-pizza/public/.htaccess
# Doit être lisible par Apache
```

## 📝 Notes importantes

- ⚠️ Ne pas oublier de déployer le fichier `.htaccess` avec le build
- ⚠️ Le fichier doit être dans le dossier `public/` (ou à la racine du serveur web)
- ⚠️ Les routes API doivent être exclues du routing SPA
- ✅ Le fichier `.htaccess` inclut déjà des optimisations (cache, compression, CORS)

## 🎯 Checklist de déploiement

- [ ] Fichier `.htaccess` déployé dans `public/`
- [ ] Build React créé (`npm run build`)
- [ ] Contenu de `dist/` copié sur le serveur
- [ ] Permissions correctes sur les fichiers
- [ ] Apache redémarré
- [ ] Test navigation directe sur `/admin`
- [ ] Test rafraîchissement page (F5)
- [ ] Test routes API fonctionnent toujours
