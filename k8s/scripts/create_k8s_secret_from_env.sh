#!/usr/bin/env bash
set -euo pipefail

# Usage: ./create_k8s_secret_from_env.sh /path/to/.env
# This script will create or update a Kubernetes Secret named `sga-secrets` in namespace `sga`
# from an env-file containing lines like KEY=VALUE.

ENV_FILE=${1:-}
NAMESPACE=${2:-sga}
SECRET_NAME=${3:-sga-secrets}

if [ -z "$ENV_FILE" ]; then
  echo "Usage: $0 /path/to/.env [namespace] [secret_name]"
  exit 2
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE"
  exit 2
fi

echo "Creating/updating Secret '$SECRET_NAME' in namespace '$NAMESPACE' from $ENV_FILE"

# Use kubectl to create a secret from env-file; use --dry-run=client -o yaml to generate YAML then apply
kubectl create secret generic "$SECRET_NAME" --from-env-file="$ENV_FILE" -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "Secret applied."
