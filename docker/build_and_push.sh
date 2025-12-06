#!/usr/bin/env bash
# Build and push script (bash)
REGISTRY="${1:-emeday17}"
TAG="${2:-latest}"
PUSH=${3:-1}

services=(
  "frontend:.:Dockerfile.frontend:sga-frontend"
  "iam:services/iam-service:Dockerfile:iam-service"
  "academico:services/academico-service:Dockerfile:academico-service"
  "personas:services/personas-service:Dockerfile:personas-service"
  "notas:services/notas-service:Dockerfile:notas-service"
)

for s in "${services[@]}"; do
  IFS=":" read -r name context dockerfile imagename <<< "$s"
  img="$REGISTRY/$imagename:$TAG"
  if [ ! -d "$context" ]; then
    echo "[warn] context $context not found, skipping $name"
    continue
  fi
  if [ ! -f "$context/$dockerfile" ]; then
    echo "[warn] Dockerfile $context/$dockerfile not found, building with default Dockerfile if present"
    docker build -t "$img" "$context" || { echo "build failed for $name"; exit 1; }
  else
    docker build -f "$context/$dockerfile" -t "$img" "$context" || { echo "build failed for $name"; exit 1; }
  fi
  if [ "$PUSH" -eq 1 ]; then
    docker push "$img" || { echo "push failed for $img"; exit 1; }
  fi
done

echo "All done."
