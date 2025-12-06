# Kubernetes manifests for notas-hexagonal

This folder contains a lightweight kustomize structure to deploy the frontend and backend microservices in this repository.

What I added (adapt and fill placeholders):

- `k8s/frontend/base/`:
  - `configmap.yaml` - runtime config for frontend
  - `deployment.yaml` - Deployment for frontend (image placeholder `tu-registry/sga-frontend:1.0.0`)
  - `service.yaml` - ClusterIP Service
  - `ingress.yaml` - Example Ingress (host `frontend.sga.local`)
  - `kustomization.yaml`

- `k8s/frontend/overlays/prod/kustomization.yaml` - example patch to set prod image.

- `k8s/backend/base/`:
  - `namespace.yaml` - `sga` namespace
  - `serviceaccount.yaml` - `sga-serviceaccount`
  - `services/*/deploy-svc.yaml` - Deployment + Service manifests for `iam`, `academico`, `personas`, `notas` (images placeholders)
  - `kustomization.yaml`

- `k8s/backend/overlays/dev/kustomization.yaml` - example overlay for dev.

Notes & next steps:

- Replace placeholder images (`tu-registry/...`) with your built images (you can use `Dockerfile.frontend` to build the frontend image).
- Update `DATABASE_URL` envs and Secrets (do NOT store secrets in plain YAML). Create `Secret` objects and reference them in the deployments instead.
- Adjust replicas, resource requests/limits, and probes to match your environment.
- If you use an external Ingress, update hostnames and TLS settings.

To deploy locally with Minikube / kind:

```bash
# apply backend (namespace will be created)
kustomize build k8s/backend/overlays/dev | kubectl apply -f -
# apply frontend
kustomize build k8s/frontend/base | kubectl apply -f -
```

If you want, I can:
- generate Secrets and a MySQL `StatefulSet` manifest under `k8s/backend/base/services/db_mysql/` (requires passwords), or
- adapt these manifests to use specific image names/tags you provide.
