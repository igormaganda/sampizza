#!/bin/bash
###############################################################################
# 🍕 Sam Pizza - Script de Validation Déploiement
# Auteur: Agent DEVOPS
# Description: Tests de validation après déploiement
###############################################################################

###############################################################################
# COULEURS
###############################################################################
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

###############################################################################
# FONCTIONS
###############################################################################

print_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "$1"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
}

test_passed() {
    echo -e "${GREEN}✓ PASS${NC} - $1"
}

test_failed() {
    echo -e "${RED}✗ FAIL${NC} - $1"
}

test_warning() {
    echo -e "${YELLOW}⚠ WARN${NC} - $1"
}

###############################################################################
# DÉBUT DES TESTS
###############################################################################

print_header "🍕 Sam Pizza - Validation Déploiement"

echo "Date: $(date)"
echo "Heure: $(date +%H:%M:%S)"
echo ""

###############################################################################
# TEST 1: API Accessibilité
###############################################################################
print_header "TEST 1: Accessibilité API"

API_URL="https://apisam.mgd-crm.com"
APP_URL="https://sam-pizza.mgd-crm.com"

echo "Test API Menu..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/menu)
if [ "$STATUS" = "200" ]; then
    test_passed "API Menu répond (HTTP $STATUS)"
else
    test_failed "API Menu ne répond pas (HTTP $STATUS)"
fi

echo "Test API Orders..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/orders)
if [ "$STATUS" = "200" ]; then
    test_passed "API Orders répond (HTTP $STATUS)"
else
    test_failed "API Orders ne répond pas (HTTP $STATUS)"
fi

###############################################################################
# TEST 2: CORS Activation
###############################################################################
print_header "TEST 2: Activation CORS"

echo "Vérification headers CORS..."

CORS_ORIGIN=$(curl -s -I ${API_URL}/api/menu | grep -i "access-control-allow-origin" || true)
CORS_METHODS=$(curl -s -I ${API_URL}/api/menu | grep -i "access-control-allow-methods" || true)
CORS_HEADERS=$(curl -s -I ${API_URL}/api/menu | grep -i "access-control-allow-headers" || true)

if [ -n "$CORS_ORIGIN" ]; then
    test_passed "CORS Origin: $CORS_ORIGIN"
else
    test_failed "CORS Origin non trouvé"
fi

if [ -n "$CORS_METHODS" ]; then
    test_passed "CORS Methods: $CORS_METHODS"
else
    test_warning "CORS Methods non trouvé"
fi

if [ -n "$CORS_HEADERS" ]; then
    test_passed "CORS Headers: $CORS_HEADERS"
else
    test_warning "CORS Headers non trouvé"
fi

###############################################################################
# TEST 3: Contenu API
###############################################################################
print_header "TEST 3: Contenu API"

echo "Vérification du menu..."

MENU_COUNT=$(curl -s ${API_URL}/api/menu | grep -o '"id"' | wc -l)

if [ "$MENU_COUNT" -ge 7 ]; then
    test_passed "Menu contient $MENU_COUNT produits"
else
    test_failed "Menu ne contient que $MENU_COUNT produits (attendu: 7+)"
fi

echo "Vérification des commandes..."
ORDERS=$(curl -s ${API_URL}/api/orders)

if echo "$ORDERS" | grep -q "^\[\]"; then
    test_passed "API Orders retourne un array (vide ou avec données)"
else
    test_warning "Format API Orders inhabituel: $(echo $ORDERS | cut -c1-50)"
fi

###############################################################################
# TEST 4: Frontend Accessibilité
###############################################################################
print_header "TEST 4: Accessibilité Frontend"

echo "Test Page d'accueil..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}/)
if [ "$STATUS" = "200" ]; then
    test_passed "Frontend répond (HTTP $STATUS)"
else
    test_failed "Frontend ne répond pas (HTTP $STATUS)"
fi

echo "Test Assets JS..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}/assets/index-*.js 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
    test_passed "Assets JS accessibles (HTTP $STATUS)"
else
    test_warning "Assets JS non vérifiés (HTTP $STATUS)"
fi

###############################################################################
# TEST 5: Performance
###############################################################################
print_header "TEST 5: Performance"

echo "Test temps de réponse API..."

TIME_MENU=$(curl -s -o /dev/null -w "%{time_total}" ${API_URL}/api/menu)
TIME_ORDERS=$(curl -s -o /dev/null -w "%{time_total}" ${API_URL}/api/orders)
TIME_APP=$(curl -s -o /dev/null -w "%{time_total}" ${APP_URL}/)

# Convertir en millisecondes
MS_MENU=$(echo "$TIME_MENU * 1000" | bc)
MS_ORDERS=$(echo "$TIME_ORDERS * 1000" | bc)
MS_APP=$(echo "$TIME_APP * 1000" | bc)

echo "API Menu: ${MS_MENU}ms"
echo "API Orders: ${MS_ORDERS}ms"
echo "Frontend: ${MS_APP}ms"

# Vérifier si < 1000ms
if (( $(echo "$TIME_MENU < 1.0" | bc -l) )); then
    test_passed "API Menu < 1000ms"
else
    test_warning "API Menu > 1000ms (${MS_MENU}ms)"
fi

###############################################################################
# TEST 6: SSL Certificat
###############################################################################
print_header "TEST 6: Certificat SSL"

echo "Vérification SSL..."

SSL_DAYS=$(echo | openssl s_client -servername ${APP_URL} -connect ${APP_URL}:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)

if [ -n "$SSL_DAYS" ]; then
    test_passed "Certificat SSL valide (expire: $SSL_DAYS)"
else
    test_warning "Certificat SSL non vérifié"
fi

###############################################################################
# RÉSUMÉ
###############################################################################
print_header "📊 RÉSUMÉ DES TESTS"

echo "Tests exécutés: $(date +%H:%M:%S)"
echo ""
echo "Actions manuelles requises:"
echo "  1. Ouvrir le navigateur: ${APP_URL}"
echo "  2. Vérifier que les produits s'affichent"
echo "  3. Ouvrir la console (F12) et vérifier les erreurs"
echo "  4. Tester la création d'une commande"
echo ""
echo "En cas de problème:"
echo "  - Consulter les logs: ssh root@109.123.249.114 'pm2 logs'"
echo "  - Vérifier CORS: curl -I ${API_URL}/api/menu | grep Access-Control"
echo ""
echo "Documentation disponible:"
echo "  - GUIDE_DEPLOIEMENT_URGENT.md"
echo "  - DEPLOYMENT.md"
echo "  - API_HEALTH_REPORT.md"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✓ Validation terminée"
echo "════════════════════════════════════════════════════════════════"
