#!/bin/bash
###############################################################################
# 🚨 Script de Déploiement URGENT - Correctifs Sécurité
# Auteur: Agent DEVOPS
# Date: 13 avril 2026
# Priorité: MAXIMALE
###############################################################################

set -e

###############################################################################
# CONFIGURATION
###############################################################################
SERVER_HOST="109.123.249.114"
API_DIR="/var/www/sam-pizza-api"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/sam-pizza-security-fix_${DATE}.log"

###############################################################################
# COULEURS
###############################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

###############################################################################
# FONCTIONS
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# DÉBUT DU DÉPLOIEMENT
###############################################################################

clear
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🚨 DÉPLOIEMENT URGENT - CORRECTIFS SÉCURITÉ                    ║
║   Sam Pizza - 13 avril 2026                                      ║
║                                                                   ║
║   Priorité: MAXIMALE                                             ║
║   Vulnérabilités: 3 endpoints admin non sécurisés                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

log ""
log "Ce script va déployer les correctifs de sécurité critiques suivants:"
log "  1. Middleware d'authentification admin"
log "  2. Sécurisation de /api/admin/stats"
log "  3. Sécurisation de /api/orders/:id/status"
log "  4. Sécurisation de /api/menu (POST)"
log "  5. Sécurisation de /api/orders (GET)"
log ""
log "Log file: $LOG_FILE"
log ""

###############################################################################
# Confirmation
###############################################################################
read -p "Continuer le déploiement? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_warning "Déploiement annulé"
    exit 0
fi

###############################################################################
# ÉTAPE 1: Connexion SSH
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 1: Vérification connexion SSH"
log "════════════════════════════════════════════════════════════════════"
log ""

if ! ssh -o ConnectTimeout=5 root@${SERVER_HOST} "echo 'Connexion OK'" 2>/dev/null; then
    log_error "Impossible de se connecter au serveur ${SERVER_HOST}"
    exit 1
fi

log_success "Connexion SSH vérifiée"
log ""

###############################################################################
# ÉTAPE 2: Backup
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 2: Backup avant modifications"
log "════════════════════════════════════════════════════════════════════"
log ""

BACKUP_DIR="/tmp/sam-pizza-security-backup-${DATE}"
ssh root@${SERVER_HOST} "mkdir -p ${BACKUP_DIR}"

if ssh root@${SERVER_HOST} "[ -d ${API_DIR} ]"; then
    ssh root@${SERVER_HOST} "cp -r ${API_DIR} ${BACKUP_DIR}/"
    log_success "Backup créé: ${BACKUP_DIR}"
else
    log_error "Répertoire API non trouvé: ${API_DIR}"
    exit 1
fi

log ""

###############################################################################
# ÉTAPE 3: Mise à jour du code
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 3: Mise à jour du code"
log "════════════════════════════════════════════════════════════════════"
log ""

log "Pull du dernier code..."
ssh root@${SERVER_HOST} "cd ${API_DIR} && git pull origin main" || {
    log_error "Git pull failed"
    exit 1
}

log_success "Code mis à jour"
log ""

###############################################################################
# ÉTAPE 4: Build
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 4: Build de l'application"
log "════════════════════════════════════════════════════════════════════"
log ""

log "Installation dépendances..."
ssh root@${SERVER_HOST} "cd ${API_DIR} && npm install --production"

log "Build backend..."
ssh root@${SERVER_HOST} "cd ${API_DIR} && npm run build" || {
    log_error "Build failed"
    exit 1
}

log_success "Build terminé"
log ""

###############################################################################
# ÉTAPE 5: Redémarrage
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 5: Redémarrage des services"
log "════════════════════════════════════════════════════════════════════"
log ""

if ssh root@${SERVER_HOST} "which pm2" >/dev/null 2>&1; then
    log "Redémarrage avec PM2..."
    ssh root@${SERVER_HOST} "pm2 restart sam-pizza-api"
    log_success "Service redémarré"
else
    log_warning "PM2 non trouvé, utilisation systemctl..."
    ssh root@${SERVER_HOST} "systemctl restart sam-pizza-api" || true
fi

log ""
log "Attente démarrage (5 secondes)..."
sleep 5

log ""

###############################################################################
# ÉTAPE 6: Validation
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "ÉTAPE 6: Validation des correctifs"
log "════════════════════════════════════════════════════════════════════"
log ""

API_URL="https://apisam.mgd-crm.com"

# Test 1: /api/admin/stats sans auth
log "Test 1: /api/admin/stats sans authentification..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/admin/stats)
if [ "$STATUS" = "401" ]; then
    log_success "Endpoint sécurisé (401 Unauthorized)"
else
    log_error "Endpoint encore vulnérable (HTTP $STATUS au lieu de 401)"
fi

# Test 2: /api/admin/stats avec mauvais token
log "Test 2: /api/admin/stats avec token invalide..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid" ${API_URL}/api/admin/stats)
if [ "$STATUS" = "403" ]; then
    log_success "Token invalide rejeté (403 Forbidden)"
else
    log_warning "Réponse inattendue (HTTP $STATUS)"
fi

# Test 3: Login admin
log "Test 3: Login admin..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"SamPizza2024!Admin"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    log_success "Login admin fonctionne"

    # Test 4: /api/admin/stats avec bon token
    log "Test 4: /api/admin/stats avec token valide..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer admin-token-xyz" ${API_URL}/api/admin/stats)
    if [ "$STATUS" = "200" ]; then
        log_success "Endpoint accessible avec token valide (200 OK)"
    else
        log_error "Endpoint inaccessible avec token valide (HTTP $STATUS)"
    fi
else
    log_error "Login admin ne fonctionne pas"
fi

log ""

###############################################################################
# FIN
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "✓ Déploiement terminé"
log "════════════════════════════════════════════════════════════════════"
log ""
log "Actions requises:"
log "  1. Vérifier que tous les tests sont PASS"
log "  2. Tester l'accès admin: https://sam-pizza.mgd-crm.com/admin"
log "  3. Surveiller les logs: ssh root@${SERVER_HOST} 'pm2 logs'"
log ""
log "Documentation:"
log "  - SECURITY_FIX_URGENT.md"
log "  - DEPLOYMENT.md"
log ""
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════════"
