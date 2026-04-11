#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/DaJourJChristophe/com.dajourchristophe.git}"
REPO_DIR="${REPO_DIR:-$HOME/com.dajourchristophe}"
BRANCH="${BRANCH:-main}"

echo "[deploy] starting deployment on $(hostname)"

export DEBIAN_FRONTEND=noninteractive

if ! command -v git >/dev/null 2>&1; then
  echo "[deploy] installing git"
  sudo apt-get update
  sudo apt-get install -y git
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "[deploy] cloning repository into $REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

echo "[deploy] syncing branch $BRANCH"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[deploy] ensuring Docker is installed"
bash scripts/install-docker-debian.sh

echo "[deploy] launching production stack"
bash scripts/deploy-prod.sh "$REPO_DIR" "$BRANCH"

echo "[deploy] done"
