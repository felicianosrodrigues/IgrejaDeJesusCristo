#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
docker compose restart backend frontend

docker compose ps
