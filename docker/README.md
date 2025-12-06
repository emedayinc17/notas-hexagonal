# Docker build & push helpers

This folder contains helper scripts to build and push Docker images for the project.

Files:

- `build_and_push.ps1` - PowerShell script that builds images for frontend and backend services and pushes them to a Docker registry (defaults to `emeday17`). Usage:

```powershell
.
\docker\build_and_push.ps1 -Registry emeday17 -Tag v1.0.0 -Push
```

- `build_and_push.sh` - Bash equivalent. Usage:

```bash
./docker/build_and_push.sh emeday17 v1.0.0 1
# args: REGISTRY TAG PUSH(1|0)
```

Notes
- The scripts assume Dockerfiles are in the standard locations:
  - frontend: root `Dockerfile.frontend`
  - services: `services/<service>/Dockerfile`
- Replace registry, image names or paths in the script if your layout differs.
- Login to Docker before pushing: `docker login`.
