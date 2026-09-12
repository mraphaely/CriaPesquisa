# CriaPesquisa

Sistema de pesquisas do **Cartão CRIA** — Secretaria de Estado da Primeira Infância de Alagoas (SECRIA).
Permite montar questionários, coletar respostas em campo, acompanhar indicadores em painel e auditar alterações.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, Vite, TypeScript, styled-components, TanStack Query, React Router, Chart.js |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Zod |
| Testes | Vitest (backend e frontend), Supertest |

## Estrutura

```
backend/     API REST (Express + Prisma)
  prisma/    schema, seed e definição das pesquisas
  scripts/   Postgres embutido para dev e utilitários
  src/       controllers, models, routes, middleware, helpers
frontend/    SPA React (Vite)
docs/        modelo ER e documentação das pesquisas
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL — **opcional**: o projeto sobe um Postgres embutido em dev (`npm run db`), sem precisar instalar nada. Também há um `docker-compose.yml` se preferir container.

## Como rodar

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # ajuste os valores
npm run db                  # sobe o Postgres embutido na porta 5433 (deixe aberto)
npx prisma db push          # cria o schema
npx prisma generate
npm run seed                # popula usuários, municípios e as pesquisas
npm run dev                 # API em http://localhost:3333/api
```

> Atalho: `npm run dev:full` sobe **banco + API** num comando só (Ctrl+C encerra os dois).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Variáveis de ambiente

### `backend/.env`

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | não | Porta da API (padrão `3333`) |
| `DATABASE_URL` | **sim** | String de conexão do PostgreSQL |
| `JWT_SECRET` | **em produção** | Segredo de assinatura dos tokens. Com `NODE_ENV=production` a API **recusa subir** sem ele |
| `JWT_EXPIRES` | não | Validade do token (padrão `8h`) |
| `SEED_PASSWORD` | não | Senha inicial das contas criadas pelo seed |
| `SEED_EMAIL_DOMINIO` | não | Domínio dos e-mails das contas-base (padrão `@exemplo.local`) |
| `CORS_ORIGIN` | não | Origens permitidas, separadas por vírgula |

### `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API (ex.: `http://localhost:3333/api`) |
| `VITE_EMAIL_DOMINIO` | Domínio usado ao montar e-mails na criação de usuários |
| `VITE_SENHA_PADRAO` | Pré-preenche a senha no formulário de novo usuário (deixe vazio em produção) |

## Scripts

**Backend**

| Comando | O que faz |
|---|---|
| `npm run dev` | API em modo watch |
| `npm run db` | Sobe o Postgres embutido (porta 5433) |
| `npm run dev:full` | Banco + API juntos |
| `npm run seed` | Popula o banco |
| `npm run build` / `npm start` | Compila / roda a build |
| `npm test` | Testes (Vitest) |

**Frontend**

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite em modo dev |
| `npm run build` | Type-check + build de produção |
| `npm test` | Testes (Vitest) |

## Perfis de acesso

O seed cria quatro contas-base, uma por papel: **ADMIN**, **GESTOR**, **COLETADOR** e **VISUALIZADOR**.
A senha delas vem de `SEED_PASSWORD`. **Troque-a antes de qualquer uso real.**

## Segurança e dados pessoais

Este sistema lida com dados de beneficiários (LGPD). Cuidados adotados no repositório:

- `.env` e `backups/` são **ignorados pelo Git** — backups contêm respostas, IPs e hashes de senha e **nunca** devem ser versionados.
- Nenhuma credencial real fica no código: senhas e segredos vêm de variáveis de ambiente.
- `JWT_SECRET` é obrigatório em produção (sem fallback previsível).
- As alterações são registradas em log de auditoria, com exclusão lógica (soft-delete).

## Direitos e licença

Este repositório é publicado **sem licença de uso**. Na ausência de uma licença explícita,
**todos os direitos são reservados**: o código pode ser lido e consultado, mas não é
concedida permissão de uso, cópia, modificação ou redistribuição.

O software foi desenvolvido no contexto de um programa da **Secretaria de Estado da
Primeira Infância de Alagoas (SECRIA)**. A definição de uma licença (e a eventual
liberação como software público) cabe à instituição responsável pela titularidade —
até lá, esta condição permanece.

Nenhum dado pessoal de beneficiários acompanha este repositório: os dados de exemplo
são sintéticos e os backups reais estão fora do controle de versão.
