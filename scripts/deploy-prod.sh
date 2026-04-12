#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-$HOME/com.dajourchristophe}"
TARGET_REF="${2:-main}"
DOCKER_COMPOSE_PREFIX=(docker compose)

if [ ! -d "$REPO_PATH/.git" ]; then
  echo "Repository not found at $REPO_PATH"
  echo "Clone it first, for example:"
  echo "  git clone <repo-url> \"$REPO_PATH\""
  exit 1
fi

cd "$REPO_PATH"

if [ -f "$REPO_PATH/.env.prod" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$REPO_PATH/.env.prod"
  set +a
elif [ -f "$REPO_PATH/infra/docker/.env.prod" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$REPO_PATH/infra/docker/.env.prod"
  set +a
fi

if ! docker info >/dev/null 2>&1; then
  DOCKER_COMPOSE_PREFIX=(sudo docker compose)
fi

git fetch origin --tags
git checkout "$TARGET_REF"

if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_REF"; then
  git pull --ff-only origin "$TARGET_REF"
else
  echo "Deploying pinned ref $TARGET_REF"
fi

SSL_DIR="$REPO_PATH/etc"
SSL_CERT="$SSL_DIR/dajourchristophe.com-certificate.pem"
SSL_CHAIN="$SSL_DIR/dajourchristophe.com-intermediate.pem"
SSL_FULLCHAIN="$SSL_DIR/dajourchristophe.com-fullchain.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_CHAIN" ]; then
  cat "$SSL_CERT" "$SSL_CHAIN" > "$SSL_FULLCHAIN"
fi

"${DOCKER_COMPOSE_PREFIX[@]}" -f infra/docker/docker-compose.prod.yml up --build -d
"${DOCKER_COMPOSE_PREFIX[@]}" -f infra/docker/docker-compose.prod.yml ps
echo "Gateway health:"
curl --fail --silent --insecure https://127.0.0.1/healthz || true
