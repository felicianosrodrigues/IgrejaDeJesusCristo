# Playbook de teste de autenticação (JWT email/senha)

## Passo 1: Verificação no MongoDB
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verificar: hash bcrypt começa com `$2b$`; índice único em users.email.

## Passo 2: Teste de API
```
curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"felicianosrodrigues@gmail.com","password":"Igreja@2026"}'
curl -b cookies.txt $API/api/auth/me
```
Login deve retornar o objeto do usuário e definir cookies `access_token` + `refresh_token`. `/me` deve retornar o mesmo usuário com os cookies.

## Passo 3: Fluxos de negócio
- Registro de membro novo, submeter oração/testemunho (fica `pending`), admin aprova em /api/admin/posts/{id}/approve e aparece em GET /api/posts?type=prayer|testimony.
- POST /api/posts/{id}/pray faz toggle e retorna {praying, count}.
- Membro registra contribuição (POST /api/contributions), admin confirma em /api/admin/contributions/{id}/confirm.
- Membro sugere evento (POST /api/suggestions), admin aprova e vira evento em GET /api/events.
