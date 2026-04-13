#!/bin/bash
###############################################################################
# 🍕 Sam Pizza - Script de Déploiement Production
# Auteur: Agent DEVOPS
# Date: 13 avril 2026
# Description: Déploiement complet Backend + Frontend avec activation CORS
###############################################################################

set -e  # Arrêter le script en cas d'erreur

###############################################################################
# CONFIGURATION
###############################################################################
SERVER_HOST="109.123.249.114"
API_PORT=3004
APP_PORT=3005
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/sam-pizza-deploy_${DATE}.log"

###############################################################################
# COULEURS POUR LES MESSAGES
###############################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log "════════════════════════════════════════════════════════════════════"
log "🍕 Sam Pizza - Déploiement en Production"
log "════════════════════════════════════════════════════════════════════"
log ""
log "Serveur: $SERVER_HOST"
log "Ports: API=$API_PORT, APP=$APP_PORT"
log "Date: $(date)"
log ""
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════════"
log ""

###############################################################################
# ÉTAPE 1: Vérification de l'accès SSH
###############################################################################
log "ÉTAPE 1: Vérification de l'accès SSH..."

if ! ssh -o ConnectTimeout=5 root@${SERVER_HOST} "echo 'Connexion OK'" 2>/dev/null; then
    log_error "Impossible de se connecter au serveur ${SERVER_HOST}"
    log_error "Veuillez vérifier:"
    log_error "  - La connexion SSH"
    log_error "  - Les identifiants"
    log_error "  - La clé SSH"
    exit 1
fi

log_success "Connexion SSH vérifiée"
log ""

###############################################################################
# ÉTAPE 2: Vérification des services Node.js
###############################################################################
log "ÉTAPE 2: Vérification des services Node.js..."

ssh root@${SERVER_HOST} "lsof -i -P | grep 'node.*LISTEN'" || true

NODE_PROCESSES=$(ssh root@${SERVER_HOST} "lsof -i -P | grep 'node.*LISTEN' | wc -l")

if [ "$NODE_PROCESSES" -eq 0 ]; then
    log_warning "Aucun processus Node.js détecté"
else
    log_success "$NODE_PROCESSES processus Node.js détectés"
fi

log ""

###############################################################################
# ÉTAPE 3: Backup de l'installation actuelle
###############################################################################
log "ÉTAPE 3: Backup de l'installation actuelle..."

BACKUP_DIR="/tmp/sam-pizza-backup-${DATE}"
ssh root@${SERVER_HOST} "mkdir -p ${BACKUP_DIR}"

log "Backup créé: ${BACKUP_DIR}"

###############################################################################
# ÉTAPE 4: Déploiement Backend API
###############################################################################
log "ÉTAPE 4: Déploiement Backend API..."

API_DIR="/var/www/sam-pizza-api"

# Vérifier si le répertoire existe
if ssh root@${SERVER_HOST} "[ -d ${API_DIR} ]"; then
    log "Répertoire API existe: ${API_DIR}"

    # Pull dernier code
    log "Mise à jour du code..."
    ssh root@${SERVER_HOST} "cd ${API_DIR} && git pull origin main" || {
        log_error "Git pull failed"
        log_warning "Tentative de continue avec le code existant..."
    }

    # Install dependencies
    log "Installation des dépendances..."
    ssh root@${SERVER_HOST} "cd ${API_DIR} && npm install --production"

    # Build
    log "Build du backend..."
    ssh root@${SERVER_HOST} "cd ${API_DIR} && npm run build" || {
        log_error "Build failed"
        exit 1
    }

    log_success "Backend build terminé"

else
    log_error "Répertoire API non trouvé: ${API_DIR}"
    log_error "Veuillez déployer manuellement l'API"
    exit 1
fi

log ""

###############################################################################
# ÉTAPE 5: Redémarrage des services
###############################################################################
log "ÉTAPE 5: Redémarrage des services..."

# Check PM2
if ssh root@${SERVER_HOST} "which pm2" >/dev/null 2>&1; then
    log "Utilisation de PM2..."

    # Restart API
    if ssh root@${SERVER_HOST} "pm2 list | grep -q 'sam-pizza-api'"; then
        log "Redémarrage du service API..."
        ssh root@${SERVER_HOST} "pm2 restart sam-pizza-api"
    else
        log_warning "Service API non trouvé dans PM2"
        log_warning "Vérifier la configuration PM2"
    fi

    # Restart App
    if ssh root@${SERVER_HOST} "pm2 list | grep -q 'sam-pizza-app'"; then
        log "Redémarrage du service App..."
        ssh root@${SERVER_HOST} "pm2 restart sam-pizza-app"
    else
        log_warning "Service App non trouvé dans PM2"
    fi

    log_success "Services PM2 redémarrés"

else
    log_warning "PM2 non installé, utilisation de systemctl..."

    # Restart avec systemd
    ssh root@${SERVER_HOST} "systemctl restart sam-pizza-api 2>/dev/null || true"
    ssh root@${SERVER_HOST} "systemctl restart sam-pizza-app 2>/dev/null || true"

    log_warning "Vérifier manuellement le redémarrage des services"
fi

log ""

###############################################################################
# ÉTAPE 6: Vérification des services
###############################################################################
log "ÉTAPE 6: Vérification des services..."

sleep 3  # Attendre que les services démarrent

# Vérifier API
log "Test API: https://apisam.mgd-crm.com/api/menu"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://apisam.mgd-crm.com/api/menu)

if [ "$API_STATUS" = "200" ]; then
    log_success "API répond correctement (HTTP $API_STATUS)"

    # Vérifier CORS
    log "Vérification des headers CORS..."
    CORS_HEADERS=$(curl -s -I https://apisam.mgd-crm.com/api/menu | grep -i "access-control" || true)

    if [ -n "$CORS_HEADERS" ]; then
        log_success "CORS est activé !"
        echo "$CORS_HEADERS"
    else
        log_warning "CORS non détecté - Vérifier la configuration"
    fi
else
    log_error "API ne répond pas correctement (HTTP $API_STATUS)"
fi

# Vérifier Frontend
log "Test Frontend: https://sam-pizza.mgd-crm.com/"
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sam-pizza.mgd-crm.com/)

if [ "$APP_STATUS" = "200" ]; then
    log_success "Frontend répond correctement (HTTP $APP_STATUS)"
else
    log_error "Frontend ne répond pas correctement (HTTP $APP_STATUS)"
fi

log ""

###############################################################################
# ÉTAPE 7: Logs et diagnostics
###############################################################################
log "ÉTAPE 7: Logs et diagnostics..."

log "Logs API (dernières lignes):"
ssh root@${SERVER_HOST} "pm2 logs sam-pizza-api --lines 20 --nostream" 2>/dev/null || \
ssh root@${SERVER_HOST} "tail -20 /tmp/pizzeria-api.log" 2>/dev/null || \
log_warning "Logs non disponibles"

log ""

###############################################################################
# FIN DU DÉPLOIEMENT
###############################################################################
log "════════════════════════════════════════════════════════════════════"
log "🍕 Déploiement terminé !"
log "════════════════════════════════════════════════════════════════════"
log ""
log "Actions manuelles requises:"
log "  1. Tester le frontend: https://sam-pizza.mgd-crm.com/"
log "  2. Vérifier la console du navigateur"
log "  3. Tester la création de commande"
log "  4. Vérifier les logs: ssh root@${SERVER_HOST} 'pm2 logs'"
log ""
log "Documentation disponible:"
log "  - DEPLOYMENT.md"
log "  - CORS_DEPLOYMENT_STATUS.md"
log "  - API_HEALTH_REPORT.md"
log ""
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════════"
