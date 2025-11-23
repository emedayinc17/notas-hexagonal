# ☸️ Kubernetes - Configuración y Despliegue

Este directorio contiene todos los manifiestos de Kubernetes para desplegar el Sistema de Gestión de Notas.

---

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `frontend-configmap.yaml` | ConfigMaps para 3 ambientes (dev, staging, prod) |
| `frontend-deployment.yaml` | Deployment, Service e Ingress del frontend |
| `KUBERNETES_DEPLOYMENT_GUIDE.md` | Guía completa de despliegue |
| `validate-config.sh` | Script de validación de configuración |

---

## 🚀 Quick Start

### 1. Validar Configuración

```bash
# Dar permisos de ejecución
chmod +x k8s/validate-config.sh

# Ejecutar validación
./k8s/validate-config.sh
```

### 2. Construir Imagen Docker

```bash
# Desde la raíz del proyecto
docker build -f Dockerfile.frontend -t tu-registry/sga-frontend:1.0.0 .
docker push tu-registry/sga-frontend:1.0.0
```

### 3. Desplegar en Kubernetes

```bash
# Aplicar ConfigMap
kubectl apply -f k8s/frontend-configmap.yaml

# Editar frontend-deployment.yaml y ajustar:
# - spec.template.spec.containers[0].image (tu imagen)
# - spec.template.spec.volumes[].configMap.name (dev/staging/prod)

# Aplicar Deployment
kubectl apply -f k8s/frontend-deployment.yaml

# Verificar
kubectl get pods
kubectl get svc frontend-service
```

---

## 🔧 Configuración por Ambiente

### Desarrollo

```yaml
volumes:
- name: frontend-config
  configMap:
    name: frontend-config-dev
```

URLs: `http://service-name:port`

### Staging

```yaml
volumes:
- name: frontend-config
  configMap:
    name: frontend-config-staging
```

URLs: `http://service.staging.svc.cluster.local:port`

### Producción

```yaml
volumes:
- name: frontend-config
  configMap:
    name: frontend-config-prod
```

URLs: `https://api.colegio.com/service`

---

## 🔄 Actualizar Configuración

Para cambiar las URLs de los servicios **sin rebuild**:

```bash
# 1. Editar ConfigMap
kubectl edit configmap frontend-config-dev

# 2. Reiniciar pods
kubectl rollout restart deployment/frontend-deployment
```

---

## 📚 Documentación Completa

Ver: **[KUBERNETES_DEPLOYMENT_GUIDE.md](./KUBERNETES_DEPLOYMENT_GUIDE.md)**

---

## ✅ Checklist

- [ ] Validar archivos: `./validate-config.sh`
- [ ] Construir imagen Docker
- [ ] Pushear al registry
- [ ] Editar `frontend-deployment.yaml` (imagen y ConfigMap)
- [ ] Aplicar ConfigMap
- [ ] Aplicar Deployment
- [ ] Verificar pods y services
- [ ] Probar acceso al frontend

---

**Desarrollado para:** Kubernetes 1.20+  
**Tested on:** Minikube, GKE, EKS, AKS
