#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.backend ]]; then
  cp .env.backend.example .env.backend
  echo "Arquivo .env.backend criado a partir de .env.backend.example"
  echo "Edite .env.backend antes de usar em producao."
fi

docker compose up -d --build

docker compose ps
