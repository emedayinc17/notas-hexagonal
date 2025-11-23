#!/bin/bash
# ============================================
# Script de Validación de Configuración
# Valida que los ConfigMaps estén correctamente configurados
# ============================================

echo "🔍 Validando Configuración para Kubernetes..."
echo "=============================================="

ERRORS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Función para imprimir éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para imprimir warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

echo ""
echo "📋 Verificando archivos necesarios..."

# Verificar que existan los archivos de configuración
if [ -f "k8s/frontend-configmap.yaml" ]; then
    success "ConfigMap encontrado: k8s/frontend-configmap.yaml"
else
    error "No se encuentra k8s/frontend-configmap.yaml"
fi

if [ -f "k8s/frontend-deployment.yaml" ]; then
    success "Deployment encontrado: k8s/frontend-deployment.yaml"
else
    error "No se encuentra k8s/frontend-deployment.yaml"
fi

if [ -f "Dockerfile.frontend" ]; then
    success "Dockerfile encontrado: Dockerfile.frontend"
else
    error "No se encuentra Dockerfile.frontend"
fi

if [ -f "frontend/js/config.js" ]; then
    success "Archivo de configuración local encontrado"
else
    warning "No se encuentra frontend/js/config.js (será reemplazado por ConfigMap)"
fi

echo ""
echo "🔎 Validando contenido de ConfigMaps..."

# Extraer y validar ConfigMaps
if [ -f "k8s/frontend-configmap.yaml" ]; then
    # Verificar que tenga los 3 ambientes
    if grep -q "frontend-config-dev" k8s/frontend-configmap.yaml; then
        success "ConfigMap DEV definido"
    else
        error "Falta ConfigMap para DEV"
    fi

    if grep -q "frontend-config-staging" k8s/frontend-configmap.yaml; then
        success "ConfigMap STAGING definido"
    else
        warning "Falta ConfigMap para STAGING (opcional)"
    fi

    if grep -q "frontend-config-prod" k8s/frontend-configmap.yaml; then
        success "ConfigMap PROD definido"
    else
        warning "Falta ConfigMap para PROD (opcional)"
    fi

    # Verificar que tengan las URLs necesarias
    REQUIRED_SERVICES=("IAM_SERVICE" "ACADEMICO_SERVICE" "PERSONAS_SERVICE" "NOTAS_SERVICE")
    
    for service in "${REQUIRED_SERVICES[@]}"; do
        if grep -q "$service" k8s/frontend-configmap.yaml; then
            success "Configuración de $service encontrada"
        else
            error "Falta configuración de $service en ConfigMap"
        fi
    done
fi

echo ""
echo "🐳 Verificando Dockerfile..."

if [ -f "Dockerfile.frontend" ]; then
    # Verificar que use nginx
    if grep -q "nginx:alpine" Dockerfile.frontend; then
        success "Usando imagen nginx:alpine"
    else
        warning "No se está usando nginx:alpine"
    fi

    # Verificar que copie los archivos del frontend
    if grep -q "COPY frontend/" Dockerfile.frontend; then
        success "Se copian archivos del frontend"
    else
        error "Falta COPY frontend/ en Dockerfile"
    fi

    # Verificar que exponga el puerto 80
    if grep -q "EXPOSE 80" Dockerfile.frontend; then
        success "Puerto 80 expuesto"
    else
        warning "No se expone el puerto 80"
    fi
fi

echo ""
echo "⚙️  Verificando Deployment..."

if [ -f "k8s/frontend-deployment.yaml" ]; then
    # Verificar que tenga el volumeMount del config
    if grep -q "mountPath: /usr/share/nginx/html/js/config.js" k8s/frontend-deployment.yaml; then
        success "ConfigMap montado correctamente en config.js"
    else
        error "Falta volumeMount de config.js"
    fi

    # Verificar que tenga el volumen del ConfigMap
    if grep -q "configMap:" k8s/frontend-deployment.yaml; then
        success "Volumen de ConfigMap definido"
    else
        error "Falta definición de volumen ConfigMap"
    fi

    # Verificar que tenga recursos definidos
    if grep -q "resources:" k8s/frontend-deployment.yaml; then
        success "Recursos (limits/requests) definidos"
    else
        warning "No se han definido recursos (recomendado)"
    fi

    # Verificar que tenga health checks
    if grep -q "livenessProbe:" k8s/frontend-deployment.yaml; then
        success "Liveness probe definido"
    else
        warning "No se ha definido liveness probe (recomendado)"
    fi

    if grep -q "readinessProbe:" k8s/frontend-deployment.yaml; then
        success "Readiness probe definido"
    else
        warning "No se ha definido readiness probe (recomendado)"
    fi
fi

echo ""
echo "=============================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Validación completada exitosamente!${NC}"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Construir imagen: docker build -f Dockerfile.frontend -t <registry>/sga-frontend:1.0.0 ."
    echo "  2. Pushear imagen: docker push <registry>/sga-frontend:1.0.0"
    echo "  3. Aplicar ConfigMap: kubectl apply -f k8s/frontend-configmap.yaml"
    echo "  4. Aplicar Deployment: kubectl apply -f k8s/frontend-deployment.yaml"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Validación falló con $ERRORS errores${NC}"
    echo ""
    echo "Por favor corrige los errores antes de desplegar."
    echo ""
    exit 1
fi
