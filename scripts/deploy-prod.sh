#!/usr/bin/env bash
set -euo pipefail

REPO_PATH="${1:-$HOME/com.dajourchristophe}"
BRANCH="${2:-main}"

if [ ! -d "$REPO_PATH/.git" ]; then
  echo "Repository not found at $REPO_PATH"
  echo "Clone it first, for example:"
  echo "  git clone <repo-url> \"$REPO_PATH\""
  exit 1
fi

cd "$REPO_PATH"

git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker compose -f infra/docker/docker-compose.prod.yml up --build -d
docker compose -f infra/docker/docker-compose.prod.yml ps
