#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/DaJourJChristophe/com.dajourchristophe.git}"
REPO_DIR="${REPO_DIR:-$HOME/com.dajourchristophe}"
TARGET_REF="${TARGET_REF:-main}"

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

echo "[deploy] syncing ref $TARGET_REF"
git fetch origin --tags
git checkout "$TARGET_REF"

if git show-ref --verify --quiet "refs/remotes/origin/$TARGET_REF"; then
  git pull --ff-only origin "$TARGET_REF"
else
  echo "[deploy] using pinned ref $TARGET_REF"
fi

echo "[deploy] ensuring Docker is installed"
bash scripts/install-docker-debian.sh

echo "[deploy] launching production stack"
bash scripts/deploy-prod.sh "$REPO_DIR" "$TARGET_REF"

echo "[deploy] done"
