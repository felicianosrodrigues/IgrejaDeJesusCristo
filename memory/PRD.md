# PRD — Aplicação Web para Igreja "Comunidade da Fé"

## Problema original
"Cria uma aplicação web: PARA UMA IGREJA, COM LOGIN E SENHA, MURAL DE ORAÇÃO, MURAL DE TESTEMUNHOS, CONTRIBUIÇÕES, AGENDA DA IGREJA"

## Escolhas do usuário
- Autenticação: login com email e senha (JWT)
- Murais: membros enviam, admin aprova antes de publicar
- Contribuições: registro informativo (PIX/dados bancários + registro manual de dízimos/ofertas)
- Agenda: admin cria eventos; membros podem sugerir eventos
- Painel admin: moderação de murais, eventos, contribuições, sugestões

## Personas
- **Admin (Feliciano Rodrigues — felicianosrodrigues@gmail.com / Igreja@2026)**: liderança da igreja, gerencia tudo.
- **Membro**: participa dos murais, vê agenda, registra contribuições, sugere eventos.

## Arquitetura
- Backend: FastAPI (`/app/backend/server.py`), rotas com prefixo `/api`, MongoDB via MONGO_URL/DB_NAME, JWT (access 8h + refresh 7d, cookies httpOnly + fallback Bearer), bcrypt, lockout anti brute-force (5 tentativas/15min).
- Frontend: React 19 + react-router 7 + Tailwind + shadcn/ui + sonner. Tema "Organic & Earthy" (Cormorant Garamond + Manrope, paleta verde/terracota conforme /app/design_guidelines.json).
- Collections: users, posts (prayer/testimony, status pending/approved/rejected, prayed_by), events, suggestions, contributions, settings (church_info), login_attempts.

## Implementado (2026-08-08, atualização 2)
- Páginas públicas para leitura (sem login): Início, Mural de Oração, Testemunhos, Agenda, Contribuições (dados PIX/bancários). GET /church-info agora é público.
- Qualquer interação exige cadastro/login: enviar pedido/testemunho, botão "Orando por você" (redireciona ao /login), sugerir evento, registrar contribuição e ver histórico. Formulários viram cartão "Entrar ou cadastrar-se" para visitantes; navbar mostra botão "Entrar" quando deslogado.
- /admin protegido: visitante → /login; membro comum → /.

## Implementado (2026-08-08)
- Auth completa: registro, login, logout, /me, refresh; admin seedado no startup.
- Mural de Oração com moderação e botão "Orando por você" (toggle otimista + contador).
- Mural de Testemunhos com moderação.
- Agenda com eventos (seed: culto, estudo, vigília) e sugestão de eventos por membros.
- Contribuições: dados PIX/bancários com copiar, formulário de registro, histórico do membro, confirmação pela tesouraria.
- Painel admin com estatísticas e 5 abas: Moderação, Eventos, Sugestões, Contribuições, Dados da Igreja.
- Testes: backend 12/12 pytest PASS; frontend E2E 15 fluxos críticos PASS (iteration_1).
- Fix: tratamento de erro no botão Copiar PIX (.catch + toast).

## Backlog priorizado
- P1: DatePicker localizado pt-BR (shadcn Calendar) no lugar dos inputs nativos de data.
- P1: Edição de eventos no admin (endpoint PUT existe; UI só cria/exclui).
- P2: Recuperação de senha (forgot/reset password).
- P2: Paginação nos murais e filtro de contribuições por período no admin.
- P2: Notificações por email (ex.: Resend) ao aprovar posts/contribuições.
- P3: Migrar @app.on_event para lifespan (deprecado no FastAPI).

## Próximas tarefas
1. Aguardar feedback do usuário sobre o MVP.
2. Implementar DatePicker pt-BR se solicitado.
