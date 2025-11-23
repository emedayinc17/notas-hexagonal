# 🚀 Guía de Despliegue en Kubernetes

Guía completa para desplegar el Sistema de Gestión de Notas en Kubernetes con configuración dinámica mediante ConfigMaps.

---

## 📋 Tabla de Contenidos

1. [Arquitectura de Configuración](#arquitectura-de-configuración)
2. [ConfigMaps para Frontend](#configmaps-para-frontend)
3. [Construcción de Imágenes](#construcción-de-imágenes)
4. [Despliegue en Kubernetes](#despliegue-en-kubernetes)
5. [Cambio de Configuración sin Rebuild](#cambio-de-configuración-sin-rebuild)

---

## 🏗️ Arquitectura de Configuración

El frontend utiliza un archivo **`config.js`** que contiene todas las URLs de los servicios backend y configuraciones de la aplicación. Este archivo puede ser reemplazado dinámicamente en Kubernetes mediante **ConfigMaps**.

### Flujo de Configuración

```
┌─────────────────────────────────────────────────────┐
│  Desarrollo Local                                   │
│  ├── frontend/js/config.js (archivo local)          │
│  └── URLs: http://localhost:8001-8004               │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Kubernetes (Dev/Staging/Prod)                      │
│  ├── ConfigMap (k8s/frontend-configmap.yaml)        │
│  ├── Monta config.js como volumen                   │
│  └── URLs: http://service.namespace.svc.cluster...  │
└─────────────────────────────────────────────────────┘
```

### Ventajas de este Enfoque

✅ **Sin rebuild de imagen**: Cambias ConfigMap, reiniciar pods  
✅ **Multi-ambiente**: Dev, Staging, Prod con misma imagen  
✅ **Centralizado**: Toda la config en un solo lugar  
✅ **Versionado**: ConfigMaps en Git  
✅ **Rollback fácil**: `kubectl rollout undo`  

---

## 📝 ConfigMaps para Frontend

### Estructura del ConfigMap

Cada ambiente tiene su propio ConfigMap con URLs específicas:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config-dev
data:
  config.js: |
    window.APP_CONFIG = {
        API_ENDPOINTS: {
            IAM_SERVICE: 'http://iam-service:8001',
            ACADEMICO_SERVICE: 'http://academico-service:8002',
            ...
        },
        ...
    };
```

### Archivos de ConfigMap

Ya tienes 3 ConfigMaps creados en `k8s/frontend-configmap.yaml`:

1. **`frontend-config-dev`**: Desarrollo  
   - URLs: `http://service-name:port`
   - Features completos habilitados

2. **`frontend-config-staging`**: Pre-producción  
   - URLs: `http://service.staging.svc.cluster.local:port`
   - Registro habilitado, token 12h

3. **`frontend-config-prod`**: Producción  
   - URLs: `https://api.colegio.com/service`
   - Registro deshabilitado, token 8h, HTTPS

---

## 🐳 Construcción de Imágenes

### Paso 1: Crear Dockerfile

Ya existe `Dockerfile.frontend` en la raíz:

```dockerfile
FROM nginx:alpine
COPY frontend/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nota importante**: El `config.js` NO se copia en la imagen, se monta desde ConfigMap.

### Paso 2: Construir la Imagen

```bash
# Desde la raíz del proyecto
docker build -f Dockerfile.frontend -t tu-registry/sga-frontend:1.0.0 .

# Ejemplo con Docker Hub
docker build -f Dockerfile.frontend -t usuario/sga-frontend:1.0.0 .

# Ejemplo con registry privado
docker build -f Dockerfile.frontend -t registry.colegio.com/sga-frontend:1.0.0 .
```

### Paso 3: Pushear al Registry

```bash
# Docker Hub
docker push usuario/sga-frontend:1.0.0

# Registry privado
docker login registry.colegio.com
docker push registry.colegio.com/sga-frontend:1.0.0

# Google Container Registry (GCR)
docker tag sga-frontend:1.0.0 gcr.io/project-id/sga-frontend:1.0.0
docker push gcr.io/project-id/sga-frontend:1.0.0

# AWS ECR
docker tag sga-frontend:1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/sga-frontend:1.0.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/sga-frontend:1.0.0
```

---

## ☸️ Despliegue en Kubernetes

### Paso 1: Crear el ConfigMap

```bash
# Desarrollo
kubectl apply -f k8s/frontend-configmap.yaml

# Esto crea:
# - frontend-config-dev
# - frontend-config-staging  
# - frontend-config-prod
```

**Verificar**:
```bash
kubectl get configmap
kubectl describe configmap frontend-config-dev
```

### Paso 2: Editar el Deployment

Edita `k8s/frontend-deployment.yaml` y ajusta:

1. **Imagen del contenedor**:
```yaml
containers:
- name: frontend
  image: tu-registry/sga-frontend:1.0.0  # ← Tu imagen
```

2. **ConfigMap a usar** (según ambiente):
```yaml
volumes:
- name: frontend-config
  configMap:
    name: frontend-config-dev  # ← dev, staging o prod
```

3. **Tipo de Service** (según necesidad):
```yaml
spec:
  type: LoadBalancer  # ← LoadBalancer, NodePort o ClusterIP
```

### Paso 3: Aplicar el Deployment

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

**Verificar**:
```bash
kubectl get deployments
kubectl get pods
kubectl get services

# Ver logs
kubectl logs -l app=sga-frontend
```

### Paso 4: Acceder al Frontend

**LoadBalancer**:
```bash
kubectl get service frontend-service
# Usa la EXTERNAL-IP
```

**NodePort**:
```bash
kubectl get service frontend-service
# http://<node-ip>:<node-port>
```

**Ingress** (si configurado):
```bash
kubectl get ingress
# http://sga.colegio.com
```

---

## 🔄 Cambio de Configuración sin Rebuild

### Escenario: Cambiar URL de un servicio

**Problema**: El servicio IAM cambió de puerto 8001 a 9001

**Solución (SIN reconstruir imagen)**:

#### 1. Editar el ConfigMap

```bash
kubectl edit configmap frontend-config-dev
```

Cambia:
```yaml
data:
  config.js: |
    window.APP_CONFIG = {
        API_ENDPOINTS: {
            IAM_SERVICE: 'http://iam-service:9001',  # ← Cambio aquí
            ...
```

O edita `k8s/frontend-configmap.yaml` y:
```bash
kubectl apply -f k8s/frontend-configmap.yaml
```

#### 2. Reiniciar los Pods

```bash
# Opción 1: Rollout restart
kubectl rollout restart deployment/frontend-deployment

# Opción 2: Eliminar pods (se recrean automáticamente)
kubectl delete pods -l app=sga-frontend
```

#### 3. Verificar

```bash
# Ver que los nuevos pods están corriendo
kubectl get pods -w

# Probar en el navegador
# La nueva configuración debería estar activa
```

**¡Listo!** Sin rebuild de imagen, sin re-push, solo actualizar ConfigMap.

---

## 🌍 Multi-Ambiente con la Misma Imagen

### Desarrollo

```yaml
spec:
  volumes:
  - name: frontend-config
    configMap:
      name: frontend-config-dev
```

```bash
kubectl apply -f k8s/frontend-deployment.yaml -n development
```

### Staging

```yaml
spec:
  volumes:
  - name: frontend-config
    configMap:
      name: frontend-config-staging
```

```bash
kubectl apply -f k8s/frontend-deployment.yaml -n staging
```

### Producción

```yaml
spec:
  volumes:
  - name: frontend-config
    configMap:
      name: frontend-config-prod
```

```bash
kubectl apply -f k8s/frontend-deployment.yaml -n production
```

**La misma imagen Docker funciona en todos los ambientes, solo cambia el ConfigMap.**

---

## 🔍 Verificación de Configuración

### Desde el Pod

```bash
# Conectarse al pod
kubectl exec -it <pod-name> -- sh

# Ver el config.js montado
cat /usr/share/nginx/html/js/config.js

# Debería mostrar el contenido del ConfigMap
```

### Desde el Navegador

1. Abre el frontend en el navegador
2. Abre DevTools (F12) → Console
3. Escribe:
```javascript
console.log(window.APP_CONFIG);
```
4. Verifica que las URLs sean las correctas

---

## 🚨 Troubleshooting

### ConfigMap no se actualiza en el Pod

**Causa**: Los ConfigMaps montados como volumen se actualizan automáticamente, pero puede tomar hasta 60 segundos.

**Solución**:
```bash
# Forzar recreación de pods
kubectl rollout restart deployment/frontend-deployment
```

### CORS Errors

**Causa**: El frontend en `https://` intenta llamar backend en `http://`

**Solución**:
1. Usa HTTPS en todos los servicios (recomendado)
2. O configura CORS en el backend para permitir el origen del frontend

### 404 en archivos JS/CSS

**Causa**: El path base no es correcto

**Solución**: Verifica que los archivos estén en `/usr/share/nginx/html/` en el pod:
```bash
kubectl exec -it <pod-name> -- ls -la /usr/share/nginx/html/
```

---

## 📦 Checklist de Despliegue

- [ ] Construir imagen Docker del frontend
- [ ] Pushear imagen al registry
- [ ] Crear ConfigMap para el ambiente (dev/staging/prod)
- [ ] Editar Deployment con la imagen correcta
- [ ] Editar Deployment con el ConfigMap correcto
- [ ] Aplicar ConfigMap: `kubectl apply -f frontend-configmap.yaml`
- [ ] Aplicar Deployment: `kubectl apply -f frontend-deployment.yaml`
- [ ] Verificar pods: `kubectl get pods`
- [ ] Verificar service: `kubectl get svc`
- [ ] Probar acceso al frontend
- [ ] Verificar configuración en el navegador (DevTools)
- [ ] Hacer pruebas de login y navegación

---

## 🎯 Ejemplo Completo

```bash
# 1. Construir imagen
docker build -f Dockerfile.frontend -t miregistry/sga-frontend:v1.0.0 .
docker push miregistry/sga-frontend:v1.0.0

# 2. Crear namespace (opcional)
kubectl create namespace sga-dev

# 3. Aplicar ConfigMap
kubectl apply -f k8s/frontend-configmap.yaml -n sga-dev

# 4. Aplicar Deployment (asegúrate de editar la imagen)
kubectl apply -f k8s/frontend-deployment.yaml -n sga-dev

# 5. Verificar
kubectl get all -n sga-dev

# 6. Obtener URL
kubectl get service frontend-service -n sga-dev

# 7. Acceder
# http://<EXTERNAL-IP>
```

---

## 🔐 Seguridad

### Secrets para Datos Sensibles

Si necesitas guardar información sensible (API keys, secrets), usa Secrets en lugar de ConfigMaps:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: frontend-secrets
type: Opaque
stringData:
  api-key: "tu-api-key-secreta"
```

Y móntalo como variable de entorno o archivo.

---

## 📚 Referencias

- [Kubernetes ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Nginx en Kubernetes](https://kubernetes.github.io/ingress-nginx/)
- [Multi-stage Docker Builds](https://docs.docker.com/build/building/multi-stage/)

---

✅ **El frontend ahora está completamente preparado para Kubernetes con configuración dinámica mediante ConfigMaps.**
