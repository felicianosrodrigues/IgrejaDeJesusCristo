# Deploy em VPS Ubuntu

## 1) Preparar projeto na VPS

```bash
cd /opt
sudo git clone <URL_DO_REPO> igreja
cd /opt/igreja
```

## 2) Rodar setup completo

```bash
sudo bash deploy/ubuntu/setup_vps.sh \
  --domain seu-dominio.com \
  --app-dir /opt/igreja \
  --backend-port 8001 \
  --backend-url https://seu-dominio.com
```

## 3) Editar variaveis do backend (obrigatorio)

Arquivo:

```bash
sudo nano /etc/igreja/backend.env
```

Campos principais:
- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `FRONTEND_URL`

Depois reinicie:

```bash
sudo bash deploy/ubuntu/restart_services.sh
```

## 4) Auto-restart

Ja configurado por:
- `systemd` (`Restart=always`) para backend
- `nginx` habilitado no boot
- watchdog em cron a cada 2 min: `/usr/local/bin/igreja-watchdog.sh`

Observacao:
- Os arquivos estáticos do frontend incluem o favicon/logo e o QR code do PIX em `frontend/public/`.

## 5) SSL (recomendado)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```
