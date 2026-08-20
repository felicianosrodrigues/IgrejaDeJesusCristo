#!/usr/bin/env bash
set -euo pipefail

sudo systemctl daemon-reload
sudo systemctl restart igreja-backend
sudo systemctl restart nginx
sudo systemctl status igreja-backend --no-pager -l || true
sudo systemctl status nginx --no-pager -l || true
