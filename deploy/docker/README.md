Deploy com Docker e Docker Compose (Ubuntu)

1) Instalar Docker e Compose plugin
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

2) Subir projeto
cd /caminho/do/projeto/deploy/docker
cp .env.backend.example .env.backend

3) Ajustar variaveis em .env.backend
MONGO_URL, DB_NAME, JWT_SECRET, FRONTEND_URL e SMTP se usar reset de senha

4) Build e start
bash up.sh

5) Ver logs
docker compose logs -f backend
docker compose logs -f frontend

6) Reiniciar servicos
bash restart.sh

Observacoes:
- restart: unless-stopped foi configurado para subir novamente no reboot e em quedas.
- frontend exposto na porta 80.
- API acessada via /api no mesmo host.
- Os arquivos estáticos do frontend incluem o favicon/logo e o QR code do PIX em `frontend/public/`.
