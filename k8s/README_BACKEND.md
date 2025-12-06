Kubernetes Backend Manifests

Files added:
- `backend-configmap.yaml` - non-sensitive configuration defaults used by backend deployments. Move secrets (database credentials, JWT secret) into Kubernetes Secrets before production and reference them in the Deployment specs.
- `backend-deployments.yaml` - Deployments and Services for the four backend services: `iam-service`, `academico-service`, `personas-service`, `notas-service`.

Quick usage

1. Edit images in `backend-deployments.yaml` to match your registry and tags.
2. Create Secrets for DB credentials and update the Deployments to reference them, for example:

```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: app-db-secret
      key: password
```

3. Apply manifests:

```powershell
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployments.yaml
```

4. Verify pods and services:

```powershell
kubectl get pods -l tier=backend
kubectl get svc iam-service,academico-service,personas-service,notas-service
```

Notes
- Readiness/liveness probes expect `/health`. If your services use a different path (e.g. `/docs` or `/`), update `backend-deployments.yaml` accordingly.
- For the frontend, a `frontend-configmap.yaml` and `frontend-deployment.yaml` already exist in this folder. Ensure the frontend `ConfigMap` references the service names you use here (e.g. `iam-service:8001`).
