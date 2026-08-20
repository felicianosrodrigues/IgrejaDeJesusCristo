#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo bash deploy/ubuntu/setup_vps.sh \
#     --domain seu-dominio.com \
#     --app-dir /opt/igreja \
#     --backend-port 8001 \
#     --backend-url https://seu-dominio.com

DOMAIN=""
APP_DIR="/opt/igreja"
BACKEND_PORT="8001"
BACKEND_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --backend-url)
      BACKEND_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Erro: informe --domain"
  exit 1
fi

if [[ -z "$BACKEND_URL" ]]; then
  BACKEND_URL="https://${DOMAIN}"
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "Erro: diretorio da aplicacao nao encontrado: $APP_DIR"
  echo "Clone/copie o projeto para esse diretorio antes de rodar o setup."
  exit 1
fi

echo "[1/10] Instalando dependencias do sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release software-properties-common \
  python3 python3-venv python3-pip nginx git

if ! command -v node >/dev/null 2>&1; then
  echo "[2/10] Instalando Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v yarn >/dev/null 2>&1; then
  echo "[3/10] Instalando Yarn"
  npm install -g yarn
fi

echo "[4/10] Configurando backend (venv + deps)"
cd "$APP_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

ENV_FILE="/etc/igreja/backend.env"
mkdir -p /etc/igreja
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[5/10] Criando template de variaveis em $ENV_FILE"
  cat > "$ENV_FILE" <<EOF
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=igreja
JWT_SECRET=troque-por-uma-chave-forte
FRONTEND_URL=https://${DOMAIN}
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@${DOMAIN}
EOF
  chmod 600 "$ENV_FILE"
  echo "ATENCAO: edite $ENV_FILE antes de colocar em producao."
fi

echo "[6/10] Criando servico systemd do backend"
cat > /etc/systemd/system/igreja-backend.service <<EOF
[Unit]
Description=Igreja Backend (FastAPI/Uvicorn)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${ENV_FILE}
ExecStart=${APP_DIR}/backend/.venv/bin/uvicorn server:app --host 127.0.0.1 --port ${BACKEND_PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "[7/10] Buildando frontend"
cd "$APP_DIR/frontend"
cat > .env.production <<EOF
REACT_APP_BACKEND_URL=${BACKEND_URL}
EOF
yarn install --frozen-lockfile || yarn install
yarn build

mkdir -p /var/www/igreja
rm -rf /var/www/igreja/*
cp -r build/* /var/www/igreja/

echo "[8/10] Configurando Nginx"
cat > /etc/nginx/sites-available/igreja <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root /var/www/igreja;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/igreja /etc/nginx/sites-enabled/igreja
rm -f /etc/nginx/sites-enabled/default
nginx -t

cat > /usr/local/bin/igreja-watchdog.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if ! systemctl is-active --quiet igreja-backend; then
  systemctl restart igreja-backend
fi

if ! curl -fsS http://127.0.0.1:${BACKEND_PORT}/api/church-info >/dev/null 2>&1; then
  systemctl restart igreja-backend
fi

if ! systemctl is-active --quiet nginx; then
  systemctl restart nginx
fi
EOF
chmod +x /usr/local/bin/igreja-watchdog.sh

# Substitui placeholder de porta no watchdog.
sed -i "s/\${BACKEND_PORT}/${BACKEND_PORT}/g" /usr/local/bin/igreja-watchdog.sh

echo "[9/10] Habilitando auto-restart e auto-start"
systemctl daemon-reload
systemctl enable igreja-backend
systemctl restart igreja-backend
systemctl enable nginx
systemctl restart nginx

# Cron watchdog a cada 2 min (reinicia se cair).
if ! crontab -l 2>/dev/null | grep -q "igreja-watchdog.sh"; then
  (crontab -l 2>/dev/null; echo "*/2 * * * * /usr/local/bin/igreja-watchdog.sh >/dev/null 2>&1") | crontab -
fi

echo "[10/10] Concluido"
echo "Backend: systemctl status igreja-backend"
echo "Nginx:   systemctl status nginx"
echo "Site:    http://${DOMAIN}"
echo "Dica SSL: sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d ${DOMAIN}"
