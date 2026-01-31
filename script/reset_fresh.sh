#!/usr/bin/env bash
set -euo pipefail

export SEED_DB=0
export SEED_MEMORY=0

if [[ -n "${DATABASE_URL:-}" ]]; then
  npm run db:clear
fi

npm run dev
