#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-$HOME/com.dajourchristophe}"
BRANCH="${2:-main}"
DOCKER_COMPOSE_PREFIX=(docker compose)

if [ ! -d "$REPO_PATH/.git" ]; then
  echo "Repository not found at $REPO_PATH"
  echo "Clone it first, for example:"
  echo "  git clone <repo-url> \"$REPO_PATH\""
  exit 1
fi

cd "$REPO_PATH"

if ! docker info >/dev/null 2>&1; then
  DOCKER_COMPOSE_PREFIX=(sudo docker compose)
fi

git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

"${DOCKER_COMPOSE_PREFIX[@]}" -f infra/docker/docker-compose.prod.yml up --build -d
"${DOCKER_COMPOSE_PREFIX[@]}" -f infra/docker/docker-compose.prod.yml ps
echo "Gateway health:"
curl --fail --silent http://127.0.0.1/healthz || true
