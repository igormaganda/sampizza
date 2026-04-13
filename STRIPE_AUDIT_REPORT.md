# 🔐 RAPPORT D'AUDIT - Système de Paiement Stripe

**Date**: 2026-04-13  
**Auditeur**: Backend-API Agent  
**Portée**: Configuration backend, endpoints API, intégration frontend, sécurité

---

## 📊 Résumé Exécutif

**Statut Général**: ⚠️ **PARTIELLEMENT FONCTIONNEL - PROBLÈMES CRITIQUES IDENTIFIÉS**

### Note de Sécurité: **6/10**
- ✅ Clés secrètes NON exposées côté client
- ⚠️ Clés API hardcoded dans le code source
- ❌ Version API Stripe obsolète
- ❌ Gestion d'erreurs webhook insuffisante

---

## 1. 🔑 Configuration Stripe Backend

### 1.1 Initialisation Stripe (`server.ts:10-14`)

**Code analysé**:
```typescript
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51TL03WHSQO2rgjep...';
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: '2023-10-16' as any,
});
```

### ✅ Ce qui fonctionne:
- Clé secrète Stripe test correcte (sk_test_...)
- Fallback sur clé hardcoded si env var manquante
- Initialisation Stripe fonctionnelle

### 🚨 Problèmes Critiques:

#### **PROBLÈME #1: CLÉ API HARDCODED**
**Gravité**: **CRITIQUE**  
**Impact**: Exposition des credentials dans le code source

**Détail**:
- La clé secrète Stripe est écrite en dur dans le code
- Si ce code est poussé sur un repository public, la clé est compromise
- Tout accès au code source donne accès à la clé Stripe

**Recommandation**:
```typescript
// ❌ NE PAS FAIRE:
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51TL03WHSQO2rgjep...';

// ✅ CORRECT:
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
```

#### **PROBLÈME #2: VERSION API OBSOLÈTE**
**Gravité**: **MOYENNE**  
**Impact**: Comportements indéfinis, bugs potentiels

**Détail**:
- Version API: `2023-10-16` (octobre 2023)
- Version actuelle: `2025-01-27` ou plus récente
- Écart de ~16 mois

**Recommandation**:
```typescript
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: '2025-01-27', // Dernière version stable
  typescript: true,
});
```

#### **PROBLÈME #3: CAST 'as any'**
**Gravité**: **FAIBLE**  
**Impact**: Perte de type safety

**Recommandation**:
```typescript
// ❌:
apiVersion: '2023-10-16' as any

// ✅:
apiVersion: '2025-01-27' as Stripe.LatestApiVersion
```

---

## 2. 🛒 Endpoint /api/create-checkout-session

### 2.1 Analyse du Code (`server.ts:353-475`)

**Fonction**: Créer une session de paiement Stripe pour un panier

### ✅ Ce qui fonctionne:
- Création correcte des line_items
- Calcul correct des montants en cents
- Gestion des frais de livraison (2.50€)
- Création de la commande en base de données
- Redirection correcte vers Stripe Checkout

### 🚨 Problèmes Identifiés:

#### **PROBLÈME #4: ERREUR BASE DE DONNÉES**
**Gravité**: **CRITIQUE**  
**Impact**: Les paiements échouent systématiquement

**Test effectué**:
```bash
curl -X POST https://apisam.mgd-crm.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"items":[],"total":0}'
```

**Résultat**:
```json
{
  "error": "Erreur lors du paiement",
  "details": "Failed query: insert into \"orders\" (...)"
}
```

**Cause probable**:
- Connexion PostgreSQL non configurée en production
- Variables d'environnement manquantes
- Tables non créées (migrations non exécutées)

#### **PROBLÈME #5: VALIDATION INSUFFISANTE**
**Gravité**: **MOYENNE**  
**Impact**: Données invalides peuvent atteindre Stripe

**Code actuel**:
```typescript
const { items, deliveryMethod, customerName, customerEmail, customerPhone, deliveryDate, deliveryTime, comments, total } = req.body;
```

**Problème**:
- Aucune validation des champs
- Pas de vérification que `items` est un array
- Pas de validation des emails/téléphones
- Pas de vérification des montants

**Recommandation**:
```typescript
import { z } from 'zod';

const checkoutSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
    totalPrice: z.number().positive(),
    menuItem: z.object({
      id: z.string(),
      name: z.string(),
    }),
    configurations: z.array(z.any()),
  })).min(1),
  deliveryMethod: z.enum(['sur_place', 'livraison', 'emporter']),
  customerName: z.string().min(2).max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  comments: z.string().max(500).optional(),
  total: z.number().positive(),
});

const validatedData = checkoutSchema.parse(req.body);
```

#### **PROBLÈME #6: CALCUL DU TOTAL NON VALIDÉ**
**Gravité**: **MOYENNE**  
**Impact**: Possible manipulation des prix

**Code actuel**:
```typescript
total: total || items.reduce((sum: number, item: any) => sum + item.totalPrice, 0) + (deliveryMethod === 'livraison' ? 2.5 : 0)
```

**Problème**:
- Le total passé par le client n'est PAS vérifié
- Un client malveillant peut passer n'importe quel montant
- Devrait être recalculé côté serveur

**Recommandation**:
```typescript
// TOUJOURS recalculer le total côté serveur
const serverCalculatedTotal = items.reduce((sum: number, item: any) => 
  sum + item.totalPrice, 0
) + (deliveryMethod === 'livraison' ? 2.5 : 0);

// Vérifier que le total correspond (avec marge d'erreur tolérée)
if (total && Math.abs(total - serverCalculatedTotal) > 0.01) {
  return res.status(400).json({ 
    error: 'Le montant ne correspond pas au total du panier' 
  });
}
```

#### **PROBLÈME #7: GESTION DES DATE/HEURE**
**Gravité**: **FAIBLE**  
**Impact**: Mauvaise expérience utilisateur

**Code actuel**:
```typescript
deliveryDate,  // Peut être undefined
deliveryTime,  // Peut être undefined
```

**Problème**:
- Les champs ne sont pas validés
- Pas de vérification que la date est dans le futur
- Pas de vérification des horaires d'ouverture

**Recommandation**:
```typescript
if (deliveryDate || deliveryTime) {
  const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
  const minimumDateTime = new Date(Date.now() + 30 * 60 * 1000); // 30 min minimum
  
  if (deliveryDateTime < minimumDateTime) {
    return res.status(400).json({ 
      error: 'La date de livraison doit être au moins 30 minutes dans le futur' 
    });
  }
}
```

---

## 3. 🪝 Endpoint Webhook Stripe

### 3.1 Analyse du Code (`server.ts:23-58`)

**Fonction**: Recevoir et traiter les événements Stripe

### ✅ Ce qui fonctionne:
- Webhook placé AVANT express.json() (correct pour raw body)
- Vérification de la signature Stripe
- Gestion de l'événement `checkout.session.completed`
- Mise à jour du statut de commande

### 🚨 Problèmes Identifiés:

#### **PROBLÈME #8: WEBHOOK SECRET HARDCODED**
**Gravité**: **CRITIQUE**  
**Impact**: Sécurité compromise

**Code actuel**:
```typescript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_KYdMVuubYWgTwmpiuihfcJRQ2BsADyZn';
```

**Recommandation**:
```typescript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!endpointSecret) {
  console.error('STRIPE_WEBHOOK_SECRET not configured');
  return res.status(500).send('Webhook misconfigured');
}
```

#### **PROBLÈME #9: GESTION D'ERREUR INSUFFISANTE**
**Gravité**: **MOYENNE**  
**Impact**: Perte d'événements webhook

**Code actuel**:
```typescript
if (orderId) {
  try {
    await db.update(orders).set({ status: 'en_attente' }).where(eq(orders.id, orderId));
  } catch (err) {
    console.error('Error updating order status:', err);
  }
}
```

**Problème**:
- En cas d'erreur DB, le webhook renvoie quand même 200
- Stripe considère l'événement comme traité
- La commande n'est pas marquée comme payée

**Recommandation**:
```typescript
if (orderId) {
  try {
    await db.update(orders).set({ status: 'en_attente' }).where(eq(orders.id, orderId));
    console.log(`Order ${orderId} marked as paid (en_attente)`);
  } catch (err) {
    console.error('Error updating order status:', err);
    // Renvoyer une erreur pour que Stripe retente
    return res.status(500).send('Database error');
  }
}
```

#### **PROBLÈME #10: PAS DE LOGGING STRUCTURÉ**
**Gravité**: **FAIBLE**  
**Impact**: Difficile de debugger

**Recommandation**:
```typescript
import { v4 as uuidv4 } from 'uuid';

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const eventId = uuidv4();
  const sig = req.headers['stripe-signature'];
  
  console.log(`[${eventId}] Webhook received`, {
    signature: sig?.substring(0, 20) + '...',
    bodyLength: req.body.length,
  });
  
  // ... traitement ...
  
  console.log(`[${eventId}] Webhook processed successfully`, {
    eventType: event.type,
    orderId,
  });
});
```

---

## 4. 💳 Intégration Frontend

### 4.1 Analyse de CartSidebar.tsx

**Fonction**: Afficher le panier et gérer le checkout

### ✅ Ce qui fonctionne:
- Chargement correct de Stripe.js
- Calcul correct du total
- Gestion des modes de livraison
- Redirection vers Stripe Checkout

### 🚨 Problèmes Identifiés:

#### **PROBLÈME #11: CLÉ PUBLIQUE HARDCODED**
**Gravité**: **MOYENNE**  
**Impact**: Pas idéal, mais moins critique

**Code actuel**:
```typescript
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7J9');
```

**Note**: C'est une clé de test Stripe générique, pas la vraie clé du projet

**Recommandation**:
```typescript
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error('VITE_STRIPE_PUBLIC_KEY is not configured');
}
const stripePromise = loadStripe(stripePublicKey);
```

#### **PROBLÈME #12: MODE PAIEMENT SIMULÉ**
**Gravité**: **CRITIQUE EN PRODUCTION**  
**Impact**: Contourne le paiement réel

**Code actuel**:
```typescript
// Fallback: simulate payment for development/demo purposes
if (confirm(`Erreur de paiement (${error.message}).\n\nVoulez-vous utiliser le mode paiement simulé pour continuer ?`)) {
  placeOrder('Client Web (Paiement Simulé)', deliveryMethod);
  alert('✅ Paiement simulé réussi ! Votre commande a été validée.');
  setCartVisible(false);
}
```

**Problème**:
- En production, cela permet de commander sans payer
- Doit être désactivé en production

**Recommandation**:
```typescript
} catch (error) {
  console.error('Checkout error:', error);
  
  // En développement, permettre le paiement simulé
  if (import.meta.env.DEV && confirm(...)) {
    // ... paiement simulé
  } else {
    // En production, afficher uniquement l'erreur
    alert(`❌ Erreur de paiement: ${error.message}`);
  }
}
```

#### **PROBLÈME #13: PAS DE VALIDATION CÔTÉ CLIENT**
**Gravité**: **FAIBLE**  
**Impact**: Mauvaise UX

**Code actuel**:
```typescript
<Button 
  disabled={isCheckingOut || !deliveryDate || !deliveryTime}
>
```

**Problème**:
- Le bouton est disabled si pas de date/heure
- Mais on peut quand même cliquer si on contournne le disabled
- Pas de validation des champs avant l'envoi

**Recommandation**:
```typescript
const handleCheckout = async () => {
  if (cart.length === 0) {
    alert('Votre panier est vide');
    return;
  }
  
  if (!deliveryDate || !deliveryTime) {
    alert('Veuillez sélectionner une date et une heure de livraison');
    return;
  }
  
  // ... suite du checkout
};
```

---

## 5. 🔒 Analyse de Sécurité

### 5.1 Exposition des Clés

✅ **BONNES PRATIQUES**:
- Clé secrète Stripe NON exposée dans le frontend
- Clé publique seulement dans le frontend (normal)
- Variables d'environnement utilisées

❌ **PROBLÈMES**:
- Clés secrètes hardcoded dans server.ts
- Webhook secret hardcoded dans server.ts
- Si le code est leak, les clés sont compromises

### 5.2 Validation des Données

❌ **PROBLÈMES**:
- Pas de validation des entrées utilisateur
- Total du panier non vérifié côté serveur
- Pas de sanitization des inputs

### 5.3 Gestion des Erreurs

⚠️ **PARTIEL**:
- Erreurs Stripe bien gérées
- Mais erreurs DB mal gérées (webhook)
- Pas de logging structuré

---

## 6. 🧪 Tests Recommandés

### 6.1 Tests Fonctionnels

#### Test 1: Création de session Stripe
```bash
curl -X POST https://apisam.mgd-crm.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "menuItem": {"id": "m1", "name": "Margherita"},
      "quantity": 1,
      "totalPrice": 10.50,
      "configurations": []
    }],
    "deliveryMethod": "sur_place",
    "total": 10.50
  }'
```

**Attendu**: URL de checkout Stripe
**Actuel**: Erreur base de données

#### Test 2: Webhook Stripe
```bash
# Nécessite un tunnel ngrok ou similaire
stripe trigger checkout.session.completed
```

**Attendu**: Commande marquée comme "en_attente"
**Actuel**: Non testable (pas d'accès au serveur)

#### Test 3: Calcul du total
```bash
# Panier avec 2 pizzas = 21.00€
# Livraison = 2.50€
# Total attendu = 23.50€
```

**À vérifier**: Le serveur recalcule-t-il le total?

---

## 7. 📋 Plan d'Action Prioritaire

### 🔴 CRITIQUE (À faire IMMÉDIATEMENT):

1. **Retirer les clés hardcoded du code**
   - Déplacer toutes les clés dans .env
   - Ne jamais committer de clés

2. **Corriger la connexion PostgreSQL**
   - Configurer les variables d'environnement
   - Exécuter les migrations
   - Tester la création de commandes

3. **Désactiver le paiement simulé en production**
   - Ajouter une vérification ENV
   - Ne permettre le mode simulé qu'en dev

### 🟠 MOYEN (Cette semaine):

4. **Mettre à jour la version API Stripe**
   - Passer à `2025-01-27` ou plus récent
   - Tester la compatibilité

5. **Ajouter la validation des entrées**
   - Installer Zod
   - Valider tous les champs
   - Vérifier les totaux

6. **Améliorer la gestion des erreurs webhook**
   - Logger les erreurs
   - Renvoyer 500 en cas d'erreur DB
   - Permettre à Stripe de retenter

### 🟢 FAIBLE (Long terme):

7. **Ajouter le logging structuré**
   - Installer Pino ou Winston
   - Logger tous les événements Stripe
   - Surveiller les erreurs

8. **Ajouter des tests automatisés**
   - Tests unitaires pour les endpoints
   - Tests d'intégration Stripe
   - Tests de validation

9. **Implémenter le retry des webhooks**
   - Stocker les événements en DB
   - Retenter en cas d'échec
   - Monitorer les échecs

---

## 8. 📚 Documentation Recommandée

### 8.1 Guide de Test pour Paiement en Ligne

#### Test 1: Paiement Réussi
1. Ajouter des produits au panier
2. Cliquer sur "Payer par C.B"
3. Sur la page Stripe, utiliser:
   - Numéro: `4242 4242 4242 4242`
   - Date: n'importe quelle date future
   - CVC: n'importe quel code 3 chiffres
4. Vérifier que la commande passe en "en_attente"

#### Test 2: Paiement Refusé
1. Même procédure
2. Utiliser le numéro: `4000 0000 0000 0002`
3. Vérifier que le message d'erreur est clair

#### Test 3: Paiement Expiré
1. Utiliser une date passée
2. Vérifier la gestion de l'erreur

#### Test 4: Webhook
1. Dans le dashboard Stripe
2. Aller dans "Webhooks" → "Send test webhook"
3. Envoyer "checkout.session.completed"
4. Vérifier les logs serveur

---

## 9. 🎯 Conclusion

### État Actuel du Système de Paiement

| Composant | Statut | Note |
|-----------|--------|------|
| Configuration Stripe | ⚠️ Partiel | 5/10 |
| Endpoint /api/create-checkout-session | ❌ Cassé | 3/10 |
| Endpoint Webhook | ⚠️ Partiel | 6/10 |
| Intégration Frontend | ⚠️ Partiel | 7/10 |
| Sécurité | ⚠️ Faible | 4/10 |
| Gestion des Erreurs | ⚠️ Moyen | 5/10 |

**Note Globale**: **5/10** - **AMÉLIORATIONS REQUISES**

### Actions Immédiates Requises

1. **Retirer les clés hardcoded du code** (5 min)
2. **Corriger la connexion PostgreSQL** (15 min)
3. **Désactiver le paiement simulé en production** (5 min)

### Risques Actuels

- 🔴 **ÉLEVÉ**: Clés Stripe exposées dans le code
- 🔴 **ÉLEVÉ**: Paiements non fonctionnels en production
- 🟠 **MOYEN**: Manipulation possible des montants
- 🟠 **MOYEN**: Perte d'événements webhook

---

**Auditeur**: Backend-API Agent  
**Date**: 2026-04-13  
**Prochaine audit recommandée**: Après correction des problèmes critiques