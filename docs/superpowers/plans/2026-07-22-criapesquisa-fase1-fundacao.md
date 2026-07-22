# CriaPesquisa — Fase 1: Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o esqueleto full-stack funcional do CriaPesquisa: banco PostgreSQL com o schema completo criado e semeado, API Express com autenticação JWT por papéis, e um frontend React com login, rota protegida, layout base (sidebar/topbar) e tema claro/escuro.

**Architecture:** Monorepo `SECRIA/CriaPesquisa/` com `backend/` (Node + TS + Express + Prisma + PostgreSQL) e `frontend/` (React + TS + Vite + Tailwind + styled-components). O backend expõe `/api` (health + auth) com middlewares de autenticação/papéis; o frontend consome via axios + TanStack Query, guardando o JWT e protegendo rotas por papel. O schema Prisma inteiro (incluindo tabelas de auditoria/versão que só serão usadas nas Fases 3–4) é criado já nesta fase para a base ficar estável.

**Tech Stack:** Node 20+, TypeScript 5, Express 4, Prisma 5, PostgreSQL 16, jsonwebtoken, bcrypt, zod, helmet, cors, pino; React 18, Vite 5, Tailwind CSS 3, styled-components 6, axios, TanStack Query 5, React Router 6; Vitest + Supertest (back), Vitest + React Testing Library (front).

## Global Constraints

- **Runtime:** Node.js 20+ (backend e ferramentas de build do frontend).
- **Linguagem:** TypeScript em todo o projeto (`strict: true`).
- **Enums (valores exatos):** `PapelUsuario = ADMIN | ENTREVISTADOR | VISUALIZADOR`; `TipoEntrevista = CRIANCA | GESTANTE`; `StatusEntrevista = COMPLETO | PENDENTE | REVISAO`; `Zona = URBANA | RURAL`; `AcaoLog = CREATE | UPDATE | DELETE | RESTORE`.
- **Estrutura de pastas (obrigatória):** backend `src/{config,controllers,helper,middleware,models,routes}` + `app.ts` + `server.ts`; frontend `public/` + `src/{App,Components,Styles}` + `index.css` + `main.tsx`. Controllers nunca chamam Prisma direto — só via repositórios em `models/`.
- **Prefixo de API:** todas as rotas sob `/api`.
- **Portas dev:** backend `3333`, frontend `5173`.
- **Banco:** PostgreSQL db `criapesquisa`, usuário `cria_user`, senha `cria_senha` (via `.env`/docker-compose).
- **Datas sensíveis:** CPF/NIS nunca são gravados nos logs do pino.

---

## File Structure

**Raiz (`SECRIA/CriaPesquisa/`):**
- `docker-compose.yml` — serviço PostgreSQL local.
- `README.md` — passo a passo de setup.

**Backend (`backend/`):**
- `package.json`, `tsconfig.json`, `.env.example`, `vitest.config.ts`
- `prisma/schema.prisma` — schema completo (todas as tabelas).
- `prisma/seed.ts` — seed de usuários, municípios e composição de benefícios.
- `data/seed_municipios.json` — copiado de `SECRIA/dashboard_cria_postgresql/data/`.
- `src/server.ts` — inicializa e escuta na porta.
- `src/app.ts` — monta Express (helmet, cors, json, rotas, errorHandler).
- `src/config/env.ts` — carrega/valida variáveis de ambiente.
- `src/config/prisma.ts` — instância única do PrismaClient.
- `src/helper/senha.ts` — hash/compare de senha (bcrypt).
- `src/helper/token.ts` — gerar/verificar JWT.
- `src/helper/validators.ts` — schemas zod (login).
- `src/middleware/auth.ts` — valida JWT e injeta `req.usuario`.
- `src/middleware/roles.ts` — autoriza por papel.
- `src/middleware/validate.ts` — valida body com zod.
- `src/middleware/errorHandler.ts` — tratamento central de erros.
- `src/models/usuarioModel.ts` — repositório de Usuario (Prisma).
- `src/controllers/authController.ts` — login, me.
- `src/controllers/healthController.ts` — health.
- `src/routes/index.ts` — agrega rotas em `/api`.
- `src/routes/authRoutes.ts`, `src/routes/healthRoutes.ts`.
- `tests/health.test.ts`, `tests/senha.test.ts`, `tests/token.test.ts`, `tests/auth.test.ts`, `tests/roles.test.ts`.

**Frontend (`frontend/`):**
- `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`, `index.html`, `vitest.setup.ts`
- `public/` — `logo-cria.svg` e ícones (copiados de `icones-cria/`).
- `src/main.tsx` — entry (React + providers).
- `src/index.css` — diretivas Tailwind + base.
- `src/Styles/tokens.ts` — tokens de cor claro/escuro.
- `src/Styles/theme.ts` — objeto de tema + tipos styled-components.
- `src/Styles/GlobalStyle.ts` — estilos globais tematizados.
- `src/App/App.tsx` — providers + router.
- `src/App/router.tsx` — definição de rotas.
- `src/App/lib/axios.ts` — cliente axios com interceptors.
- `src/App/lib/queryClient.ts` — QueryClient do TanStack.
- `src/App/auth/AuthContext.tsx`, `src/App/auth/useAuth.ts`, `src/App/auth/ProtectedRoute.tsx`.
- `src/App/api/useLogin.ts` — mutation de login.
- `src/App/pages/Login.tsx`, `src/App/pages/Dashboard.tsx` (placeholder), demais placeholders.
- `src/Components/layout/Sidebar.tsx`, `Topbar.tsx`, `Layout.tsx`.
- `src/Components/ui/ThemeToggle.tsx`, `Button.tsx`.
- `src/App/theme/ThemeModeContext.tsx` — estado do tema (claro/escuro) + persistência.
- Testes ao lado dos componentes: `*.test.tsx`.

---

## Task 1: Backend — projeto Express com health check

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts`, `backend/.env.example`
- Create: `backend/src/server.ts`, `backend/src/app.ts`, `backend/src/config/env.ts`, `backend/src/middleware/errorHandler.ts`, `backend/src/controllers/healthController.ts`, `backend/src/routes/healthRoutes.ts`, `backend/src/routes/index.ts`
- Test: `backend/tests/health.test.ts`

**Interfaces:**
- Produces: `createApp(): Express` (em `src/app.ts`); `GET /api/health` → `{ status: "ok", service: "criapesquisa" }`; `errorHandler` middleware; `env` objeto com `{ PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES }`.

- [ ] **Step 1: Criar `backend/package.json`**

```json
{
  "name": "criapesquisa-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "seed": "tsx prisma/seed.ts"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^5.19.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "pino": "^9.3.2",
    "pino-http": "^10.2.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "prisma": "^5.19.0",
    "supertest": "^7.0.0",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Criar `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "prisma"]
}
```

- [ ] **Step 3: Criar `backend/vitest.config.ts` e `backend/.env.example`**

`backend/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"], hookTimeout: 30000 },
});
```

`backend/.env.example`:
```dotenv
PORT=3333
DATABASE_URL=postgresql://cria_user:cria_senha@localhost:5432/criapesquisa?schema=public
JWT_SECRET=troque-este-segredo-em-producao
JWT_EXPIRES=8h
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 4: Criar `src/config/env.ts`**

```ts
import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET", "dev-secret"),
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? "8h",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
```

> Adicionar `dotenv` às dependências: `npm i dotenv@^16` (ajustar package.json).

- [ ] **Step 5: Criar `src/middleware/errorHandler.ts`**

```ts
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: { code: "VALIDACAO", message: "Dados inválidos", details: err.flatten() } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  return res.status(500).json({ error: { code: "ERRO_INTERNO", message: "Erro interno" } });
};
```

- [ ] **Step 6: Criar controller e rotas de health**

`src/controllers/healthController.ts`:
```ts
import type { Request, Response } from "express";

export function health(_req: Request, res: Response) {
  res.json({ status: "ok", service: "criapesquisa" });
}
```

`src/routes/healthRoutes.ts`:
```ts
import { Router } from "express";
import { health } from "../controllers/healthController.js";

export const healthRoutes = Router();
healthRoutes.get("/health", health);
```

`src/routes/index.ts`:
```ts
import { Router } from "express";
import { healthRoutes } from "./healthRoutes.js";

export const apiRoutes = Router();
apiRoutes.use(healthRoutes);
```

- [ ] **Step 7: Criar `src/app.ts` e `src/server.ts`**

`src/app.ts`:
```ts
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(errorHandler);
  return app;
}
```

`src/server.ts`:
```ts
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
app.listen(env.PORT, () => console.log(`CriaPesquisa API em http://localhost:${env.PORT}`));
```

- [ ] **Step 8: Escrever o teste que falha `tests/health.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("responde ok", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "criapesquisa" });
  });
});
```

- [ ] **Step 9: Instalar deps e rodar o teste (deve passar)**

Run:
```bash
cd SECRIA/CriaPesquisa/backend && npm install && npm i dotenv@^16 && npm test
```
Expected: `tests/health.test.ts` PASS (1 passed).

- [ ] **Step 10: Commit**

```bash
git add backend
git commit -m "feat(backend): scaffold express app com health check"
```

---

## Task 2: Backend — schema Prisma completo + docker-compose

**Files:**
- Create: `docker-compose.yml` (raiz), `backend/prisma/schema.prisma`, `backend/src/config/prisma.ts`
- Copy: `backend/data/seed_municipios.json` (de `SECRIA/dashboard_cria_postgresql/data/seed_municipios.json`)
- Test: `backend/tests/db.test.ts`

**Interfaces:**
- Produces: `prisma` (PrismaClient exportado de `src/config/prisma.ts`); modelos `Usuario`, `MunicipioMensal`, `BeneficioComposicao`, `Entrevista`, `DetalheCrianca`, `DetalheGestante`, `LogAlteracao`, `EntrevistaVersao`; enums da §Global Constraints.

- [ ] **Step 1: Criar `docker-compose.yml` na raiz do projeto**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: criapesquisa_pg
    environment:
      POSTGRES_DB: criapesquisa
      POSTGRES_USER: cria_user
      POSTGRES_PASSWORD: cria_senha
    ports:
      - "5432:5432"
    volumes:
      - criapesquisa_pgdata:/var/lib/postgresql/data
volumes:
  criapesquisa_pgdata:
```

- [ ] **Step 2: Criar `backend/prisma/schema.prisma` (schema completo)**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PapelUsuario { ADMIN ENTREVISTADOR VISUALIZADOR }
enum TipoEntrevista { CRIANCA GESTANTE }
enum StatusEntrevista { COMPLETO PENDENTE REVISAO }
enum Zona { URBANA RURAL }
enum AcaoLog { CREATE UPDATE DELETE RESTORE }

model Usuario {
  id        String       @id @default(uuid())
  nome      String
  email     String       @unique
  senhaHash String
  papel     PapelUsuario
  ativo     Boolean      @default(true)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  criadas       Entrevista[] @relation("EntrevistaCriadaPor")
  atualizadas   Entrevista[] @relation("EntrevistaAtualizadaPor")
  excluidas     Entrevista[] @relation("EntrevistaExcluidaPor")
  logs          LogAlteracao[]
  versoes       EntrevistaVersao[]
}

model MunicipioMensal {
  id                 Int    @id @default(autoincrement())
  ano                Int
  mes                Int
  mesNome            String
  municipio          String
  regional           String
  totalBeneficiarios Int
  criancas           Int
  gestantes          Int
  valorTotal         Float
  rendaMedia         Float
  @@unique([ano, mes, municipio])
  @@index([ano, mes])
  @@index([regional])
  @@index([municipio])
}

model BeneficioComposicao {
  id         Int    @id @default(autoincrement())
  ano        Int
  mes        Int
  label      String
  quantidade Int
  @@index([ano, mes])
}

model Entrevista {
  id                        String           @id @default(uuid())
  nome                      String
  cpf                       String
  nis                       String?
  tipo                      TipoEntrevista
  municipio                 String
  regional                  String
  zona                      Zona
  renda                     Float
  status                    StatusEntrevista @default(PENDENTE)
  data                      DateTime         @db.Date
  ano                       Int
  mes                       Int
  satisfacao                Int?
  nps                       Int?
  principalUsoBeneficio     String?
  dificuldadesRelatadas     String[]
  canalDivulgacao           String?
  contribSegFinanceira      Int?
  contribAlimentacao        Int?
  contribSaude              Int?
  contribBemEstarEmocional  Int?
  observacoes               String?
  versaoAtual               Int              @default(1)
  createdById               String
  updatedById               String?
  deletedAt                 DateTime?
  deletedById               String?
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt
  createdBy   Usuario  @relation("EntrevistaCriadaPor", fields: [createdById], references: [id])
  updatedBy   Usuario? @relation("EntrevistaAtualizadaPor", fields: [updatedById], references: [id])
  deletedBy   Usuario? @relation("EntrevistaExcluidaPor", fields: [deletedById], references: [id])
  detalheCrianca  DetalheCrianca?
  detalheGestante DetalheGestante?
  versoes         EntrevistaVersao[]
  @@index([ano, mes])
  @@index([regional])
  @@index([tipo])
  @@index([status])
  @@index([deletedAt])
}

model DetalheCrianca {
  id                    String  @id @default(uuid())
  entrevistaId          String  @unique
  parentesco            String
  idadeResponsavel      Int
  racaCor               String
  orientacaoSexual      String?
  sexoBiologicoResp     String?
  identidadeGenero      String?
  estadoCivil           String
  escolaridade          String
  gruposTradicionais    String[]
  moradia               String?
  pessoasResidencia     Int?
  maeSolo               Boolean @default(false)
  nomeCrianca           String
  cpfCrianca            String?
  dataNascimentoCrianca DateTime @db.Date
  sexoBiologicoCrianca  String
  idadeCrianca          Int
  educacaoInfantil      String
  pesoAoNascer          String
  aleitamento           String
  deficienciaSindrome   String  @default("Não")
  consultasPuericulturaAno Int   @default(0)
  vacinacaoAntes        String
  vacinacaoApos         String
  odontoAntes           String
  odontoApos            String
  suplementoFerro       String
  vitaminaA             String
  refeicoesAntes        String
  refeicoesApos         String
  criancaFelizAntes     String?
  criancaFelizApos      String?
  crasAntes             String?
  crasApos              String?
  visitasCrasAno        Int     @default(0)
  entrevista Entrevista @relation(fields: [entrevistaId], references: [id], onDelete: Cascade)
}

model DetalheGestante {
  id                     String  @id @default(uuid())
  entrevistaId           String  @unique
  idade                  Int
  racaCor                String
  orientacaoSexual       String?
  sexoBiologico          String?
  identidadeGenero       String?
  estadoCivil            String
  escolaridade           String
  gruposTradicionais     String[]
  moradia                String?
  pessoasResidencia      Int?
  maeSolo                Boolean @default(false)
  gestacao               String
  partos                 String?
  planejadaAnterior      String?
  planejadaAtual         String?
  inicioPreNatalAnterior String?
  inicioPreNatalAtual    String
  riscoGestacional       String
  vacinacao              String
  exameHemograma         Boolean @default(false)
  exameGlicemia          Boolean @default(false)
  exameHivSifilis        Boolean @default(false)
  exameUltrassom         Boolean @default(false)
  exameUrina             Boolean @default(false)
  refeicoesAntes         String
  refeicoesApos          String
  criancaFelizAntes      String?
  criancaFelizApos       String?
  crasAntes              String?
  crasApos               String?
  visitasCrasAno         Int     @default(0)
  entrevista Entrevista @relation(fields: [entrevistaId], references: [id], onDelete: Cascade)
}

model LogAlteracao {
  id          String   @id @default(uuid())
  entidade    String
  entidadeId  String
  acao        AcaoLog
  usuarioId   String
  dadosAntes  Json?
  dadosDepois Json?
  ip          String?
  createdAt   DateTime @default(now())
  usuario Usuario @relation(fields: [usuarioId], references: [id])
  @@index([entidade, entidadeId])
  @@index([usuarioId])
  @@index([createdAt])
}

model EntrevistaVersao {
  id           String   @id @default(uuid())
  entrevistaId String
  versao       Int
  snapshot     Json
  usuarioId    String
  createdAt    DateTime @default(now())
  entrevista Entrevista @relation(fields: [entrevistaId], references: [id], onDelete: Cascade)
  usuario    Usuario    @relation(fields: [usuarioId], references: [id])
  @@unique([entrevistaId, versao])
}
```

- [ ] **Step 3: Copiar dados semente**

Run:
```bash
mkdir -p SECRIA/CriaPesquisa/backend/data
cp SECRIA/dashboard_cria_postgresql/data/seed_municipios.json SECRIA/CriaPesquisa/backend/data/seed_municipios.json
```

- [ ] **Step 4: Criar `src/config/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

- [ ] **Step 5: Subir o banco, gerar cliente e migrar**

Run:
```bash
cd SECRIA/CriaPesquisa && docker compose up -d postgres
cd backend && cp .env.example .env && npx prisma migrate dev --name init && npx prisma generate
```
Expected: migração `init` aplicada; "Your database is now in sync with your schema".

- [ ] **Step 6: Escrever teste que falha `tests/db.test.ts`**

```ts
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/config/prisma.js";

describe("Prisma / schema", () => {
  afterAll(async () => { await prisma.$disconnect(); });

  it("cria e lê um usuário", async () => {
    const email = `teste-${Date.now()}@cria.al`;
    const criado = await prisma.usuario.create({
      data: { nome: "Teste", email, senhaHash: "x", papel: "ADMIN" },
    });
    const lido = await prisma.usuario.findUnique({ where: { id: criado.id } });
    expect(lido?.email).toBe(email);
    expect(lido?.papel).toBe("ADMIN");
    await prisma.usuario.delete({ where: { id: criado.id } });
  });
});
```

- [ ] **Step 7: Rodar o teste (deve passar com o banco no ar)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- db`
Expected: `tests/db.test.ts` PASS.

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml backend/prisma backend/data backend/src/config/prisma.ts backend/tests/db.test.ts
git commit -m "feat(backend): schema prisma completo + postgres via docker-compose"
```

---

## Task 3: Backend — helpers de senha e token (TDD)

**Files:**
- Create: `backend/src/helper/senha.ts`, `backend/src/helper/token.ts`
- Test: `backend/tests/senha.test.ts`, `backend/tests/token.test.ts`

**Interfaces:**
- Produces: `hashSenha(senha: string): Promise<string>`; `conferirSenha(senha: string, hash: string): Promise<boolean>`; `gerarToken(payload: { sub: string; papel: string }): string`; `verificarToken(token: string): { sub: string; papel: string }`.

- [ ] **Step 1: Escrever `tests/senha.test.ts` (falha)**

```ts
import { describe, it, expect } from "vitest";
import { hashSenha, conferirSenha } from "../src/helper/senha.js";

describe("helper de senha", () => {
  it("gera hash diferente do texto e confere corretamente", async () => {
    const hash = await hashSenha("segredo123");
    expect(hash).not.toBe("segredo123");
    expect(await conferirSenha("segredo123", hash)).toBe(true);
    expect(await conferirSenha("errada", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar (deve falhar por módulo inexistente)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- senha`
Expected: FAIL (Cannot find module '../src/helper/senha').

- [ ] **Step 3: Implementar `src/helper/senha.ts`**

```ts
import bcrypt from "bcryptjs";

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
```

- [ ] **Step 4: Rodar (senha deve passar)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- senha`
Expected: PASS.

- [ ] **Step 5: Escrever `tests/token.test.ts` (falha)**

```ts
import { describe, it, expect } from "vitest";
import { gerarToken, verificarToken } from "../src/helper/token.js";

describe("helper de token", () => {
  it("gera e verifica um JWT preservando o payload", () => {
    const token = gerarToken({ sub: "u1", papel: "ADMIN" });
    const dados = verificarToken(token);
    expect(dados.sub).toBe("u1");
    expect(dados.papel).toBe("ADMIN");
  });

  it("lança erro em token inválido", () => {
    expect(() => verificarToken("token.invalido")).toThrow();
  });
});
```

- [ ] **Step 6: Implementar `src/helper/token.ts`**

```ts
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenPayload = { sub: string; papel: string };

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });
}

export function verificarToken(token: string): TokenPayload {
  const dados = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return { sub: String(dados.sub), papel: String(dados.papel) };
}
```

- [ ] **Step 7: Rodar os dois testes (devem passar)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- senha token`
Expected: PASS (ambos).

- [ ] **Step 8: Commit**

```bash
git add backend/src/helper backend/tests/senha.test.ts backend/tests/token.test.ts
git commit -m "feat(backend): helpers de senha (bcrypt) e token (jwt) com testes"
```

---

## Task 4: Backend — middlewares de auth/roles/validate (TDD)

**Files:**
- Create: `backend/src/middleware/auth.ts`, `backend/src/middleware/roles.ts`, `backend/src/middleware/validate.ts`, `backend/src/helper/validators.ts`
- Create: `backend/src/types/express.d.ts` (augmenta `Request` com `usuario`)
- Test: `backend/tests/roles.test.ts`

**Interfaces:**
- Consumes: `verificarToken` (Task 3); `HttpError` (Task 1).
- Produces: `autenticar` (middleware); `exigirPapel(...papeis: string[])` (middleware); `validar(schema)` (middleware); `loginSchema` (zod); `req.usuario: { id: string; papel: string }`.

- [ ] **Step 1: Criar augmentation `src/types/express.d.ts`**

```ts
import "express";
declare global {
  namespace Express {
    interface Request { usuario?: { id: string; papel: string }; }
  }
}
```

> Incluir `src/types` no `tsconfig.json` (`"include": ["src", "prisma"]` já cobre `src`).

- [ ] **Step 2: Implementar `src/middleware/auth.ts`**

```ts
import type { RequestHandler } from "express";
import { verificarToken } from "../helper/token.js";
import { HttpError } from "./errorHandler.js";

export const autenticar: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "NAO_AUTENTICADO", "Token ausente");
  try {
    const { sub, papel } = verificarToken(header.slice(7));
    req.usuario = { id: sub, papel };
    next();
  } catch {
    throw new HttpError(401, "TOKEN_INVALIDO", "Token inválido ou expirado");
  }
};
```

- [ ] **Step 3: Implementar `src/middleware/roles.ts`**

```ts
import type { RequestHandler } from "express";
import { HttpError } from "./errorHandler.js";

export function exigirPapel(...papeis: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) throw new HttpError(401, "NAO_AUTENTICADO", "Não autenticado");
    if (!papeis.includes(req.usuario.papel)) throw new HttpError(403, "SEM_PERMISSAO", "Sem permissão");
    next();
  };
}
```

- [ ] **Step 4: Implementar `src/middleware/validate.ts` e `src/helper/validators.ts`**

`src/middleware/validate.ts`:
```ts
import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export function validar(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => { req.body = schema.parse(req.body); next(); };
}
```

`src/helper/validators.ts`:
```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 5: Escrever `tests/roles.test.ts` (falha se lógica errada)**

```ts
import { describe, it, expect, vi } from "vitest";
import { exigirPapel } from "../src/middleware/roles.js";
import { HttpError } from "../src/middleware/errorHandler.js";

function chamar(papel: string | undefined, permitidos: string[]) {
  const req: any = papel ? { usuario: { id: "u", papel } } : {};
  const next = vi.fn();
  const run = () => exigirPapel(...permitidos)(req, {} as any, next);
  return { run, next };
}

describe("exigirPapel", () => {
  it("chama next quando papel é permitido", () => {
    const { run, next } = chamar("ADMIN", ["ADMIN", "ENTREVISTADOR"]);
    run();
    expect(next).toHaveBeenCalledOnce();
  });
  it("lança 403 quando papel não é permitido", () => {
    const { run } = chamar("VISUALIZADOR", ["ADMIN"]);
    expect(run).toThrow(HttpError);
  });
  it("lança 401 quando não autenticado", () => {
    const { run } = chamar(undefined, ["ADMIN"]);
    expect(run).toThrow(HttpError);
  });
});
```

- [ ] **Step 6: Rodar (deve passar)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- roles`
Expected: PASS (3 testes).

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware backend/src/helper/validators.ts backend/src/types backend/tests/roles.test.ts
git commit -m "feat(backend): middlewares de auth, papéis e validação zod"
```

---

## Task 5: Backend — repositório de usuário + login/me (TDD de integração)

**Files:**
- Create: `backend/src/models/usuarioModel.ts`, `backend/src/controllers/authController.ts`, `backend/src/routes/authRoutes.ts`
- Modify: `backend/src/routes/index.ts` (registrar authRoutes)
- Test: `backend/tests/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2); `hashSenha`/`conferirSenha` (Task 3); `gerarToken` (Task 3); `autenticar` (Task 4); `validar`+`loginSchema` (Task 4).
- Produces: `usuarioModel.buscarPorEmail(email)`, `usuarioModel.buscarPorId(id)`; `POST /api/auth/login` → `{ token, usuario }`; `GET /api/auth/me` → `{ usuario }`.

- [ ] **Step 1: Implementar `src/models/usuarioModel.ts`**

```ts
import { prisma } from "../config/prisma.js";

const publico = { id: true, nome: true, email: true, papel: true, ativo: true } as const;

export const usuarioModel = {
  buscarPorEmail: (email: string) => prisma.usuario.findUnique({ where: { email } }),
  buscarPublicoPorId: (id: string) => prisma.usuario.findUnique({ where: { id }, select: publico }),
};
```

- [ ] **Step 2: Implementar `src/controllers/authController.ts`**

```ts
import type { Request, Response } from "express";
import { usuarioModel } from "../models/usuarioModel.js";
import { conferirSenha } from "../helper/senha.js";
import { gerarToken } from "../helper/token.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body as { email: string; senha: string };
  const usuario = await usuarioModel.buscarPorEmail(email);
  if (!usuario || !usuario.ativo || !(await conferirSenha(senha, usuario.senhaHash))) {
    throw new HttpError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos");
  }
  const token = gerarToken({ sub: usuario.id, papel: usuario.papel });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel } });
}

export async function me(req: Request, res: Response) {
  const usuario = await usuarioModel.buscarPublicoPorId(req.usuario!.id);
  if (!usuario) throw new HttpError(404, "NAO_ENCONTRADO", "Usuário não encontrado");
  res.json({ usuario });
}
```

- [ ] **Step 3: Criar `src/routes/authRoutes.ts` e registrar em `index.ts`**

`src/routes/authRoutes.ts`:
```ts
import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { autenticar } from "../middleware/auth.js";
import { validar } from "../middleware/validate.js";
import { loginSchema } from "../helper/validators.js";

export const authRoutes = Router();
authRoutes.post("/auth/login", validar(loginSchema), login);
authRoutes.get("/auth/me", autenticar, me);
```

Modificar `src/routes/index.ts`:
```ts
import { Router } from "express";
import { healthRoutes } from "./healthRoutes.js";
import { authRoutes } from "./authRoutes.js";

export const apiRoutes = Router();
apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
```

> Nota: os controllers async lançam erros; envolver com wrapper não é necessário no Express 5, mas como usamos Express 4, adicionar `import "express-async-errors";` no topo de `src/app.ts` e a dependência `express-async-errors@^3`. Ajustar package.json e o `createApp`.

- [ ] **Step 4: Escrever `tests/auth.test.ts` (integração, falha)**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { hashSenha } from "../src/helper/senha.js";

const app = createApp();
const email = `login-${Date.now()}@cria.al`;
let usuarioId: string;

beforeAll(async () => {
  const u = await prisma.usuario.create({
    data: { nome: "Login Teste", email, senhaHash: await hashSenha("senha123"), papel: "ENTREVISTADOR" },
  });
  usuarioId = u.id;
});
afterAll(async () => {
  await prisma.usuario.delete({ where: { id: usuarioId } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("faz login com credenciais válidas", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, senha: "senha123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.usuario.papel).toBe("ENTREVISTADOR");
  });
  it("rejeita senha errada com 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, senha: "errada" });
    expect(res.status).toBe(401);
  });
  it("retorna 422 para body inválido", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nao-email" });
    expect(res.status).toBe(422);
  });
  it("me retorna o usuário do token", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, senha: "senha123" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe(email);
  });
  it("me sem token retorna 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 5: Instalar `express-async-errors` e rodar o teste**

Run:
```bash
cd SECRIA/CriaPesquisa/backend && npm i express-async-errors@^3 && npm test -- auth
```
Expected: `tests/auth.test.ts` PASS (5 testes). (Postgres precisa estar no ar.)

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/package.json backend/tests/auth.test.ts
git commit -m "feat(backend): login JWT e /auth/me com testes de integração"
```

---

## Task 6: Backend — seed de usuários, municípios e benefícios

**Files:**
- Create: `backend/prisma/seed.ts`
- Test: `backend/tests/seed.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2); `hashSenha` (Task 3); `data/seed_municipios.json`.
- Produces: função de seed idempotente; usuários `admin@cria.al` / `entrevistador@cria.al` / `visualizador@cria.al` (senha `cria123`); tabelas `MunicipioMensal` e `BeneficioComposicao` populadas.

- [ ] **Step 1: Implementar `prisma/seed.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "../src/config/prisma.js";
import { hashSenha } from "../src/helper/senha.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const FATOR_MES = [0.91,0.94,0.96,0.98,1.0,1.02,1.03,1.04,1.05,1.06,1.08,1.1];
const FATOR_ANO: Record<number, number> = { 2024: 0.92, 2025: 1.0, 2026: 1.07 };
const ANOS = [2024, 2025, 2026];

// mapa mínimo de regionais (município -> regional) reutilizado do backend Python
import { REGIONAL_POR_MUNICIPIO } from "../src/helper/regionais.js";

async function seedUsuarios() {
  const base = [
    { nome: "Administrador", email: "admin@cria.al", papel: "ADMIN" as const },
    { nome: "Entrevistador", email: "entrevistador@cria.al", papel: "ENTREVISTADOR" as const },
    { nome: "Visualizador", email: "visualizador@cria.al", papel: "VISUALIZADOR" as const },
  ];
  for (const u of base) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, senhaHash: await hashSenha("cria123") },
    });
  }
}

async function seedMunicipios() {
  if ((await prisma.municipioMensal.count()) > 0) return;
  const seed = JSON.parse(readFileSync(join(__dir, "..", "data", "seed_municipios.json"), "utf-8")) as any[];
  const rows: any[] = [];
  for (const d of seed) {
    for (const ano of ANOS) {
      for (let i = 0; i < 12; i++) {
        const f = FATOR_ANO[ano] * FATOR_MES[i];
        rows.push({
          ano, mes: i + 1, mesNome: MESES[i], municipio: d.municipio,
          regional: REGIONAL_POR_MUNICIPIO[d.municipio] ?? "Sem regional informada",
          totalBeneficiarios: Math.round(d.total_beneficiarios * f),
          criancas: Math.round(d.criancas * f),
          gestantes: Math.round(d.gestantes * f),
          valorTotal: Math.round(d.valor_total * f * 100) / 100,
          rendaMedia: d.renda_media,
        });
      }
    }
  }
  await prisma.municipioMensal.createMany({ data: rows, skipDuplicates: true });
}

async function seedBeneficios() {
  if ((await prisma.beneficioComposicao.count()) > 0) return;
  const base = [
    ["Bolsa Família", 76445], ["BF + PAIF", 6399], ["BF + Criança Feliz", 4416],
    ["BF + PL", 3395], ["BF + BVG", 1460], ["BF + BCN", 1198],
  ] as const;
  await prisma.beneficioComposicao.createMany({
    data: base.map(([label, quantidade]) => ({ ano: 2025, mes: 6, label, quantidade })),
  });
}

async function main() {
  await seedUsuarios();
  await seedMunicipios();
  await seedBeneficios();
  console.log("Seed concluído.");
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Criar `src/helper/regionais.ts` (mapa município → regional)**

Portar `REGIONAL_MAP` de `SECRIA/dashboard_cria_postgresql/app.py` (linhas 23–34) invertido para `{ [municipio]: regional }`, exportando `REGIONAL_POR_MUNICIPIO`. Exemplo (início — completar com todos os municípios do app.py):

```ts
const REGIONAL_MAP: Record<string, string[]> = {
  "1ª Regional – Maceió": ["Maceió","Marechal Deodoro","Rio Largo","Santa Luzia do Norte","Satuba","Coqueiro Seco","Messias","Murici","Pilar","Paripueira","São Luís do Quitunde","Flexeiras","Boca da Mata","Barra de São Miguel","Roteiro","Coruripe","São Miguel dos Campos","Jequiá da Praia","Atalaia"],
  // ... 2ª a 10ª Regional exatamente como no app.py ...
};

export const REGIONAL_POR_MUNICIPIO: Record<string, string> = Object.fromEntries(
  Object.entries(REGIONAL_MAP).flatMap(([reg, muns]) => muns.map((m) => [m, reg]))
);
```

- [ ] **Step 3: Rodar o seed**

Run: `cd SECRIA/CriaPesquisa/backend && npm run seed`
Expected: "Seed concluído."

- [ ] **Step 4: Escrever `tests/seed.test.ts`**

```ts
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/config/prisma.js";

afterAll(async () => { await prisma.$disconnect(); });

describe("seed", () => {
  it("criou os três usuários padrão", async () => {
    const total = await prisma.usuario.count({ where: { email: { endsWith: "@cria.al" } } });
    expect(total).toBeGreaterThanOrEqual(3);
  });
  it("populou municípios e benefícios", async () => {
    expect(await prisma.municipioMensal.count()).toBeGreaterThan(0);
    expect(await prisma.beneficioComposicao.count()).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Rodar o teste (deve passar)**

Run: `cd SECRIA/CriaPesquisa/backend && npm test -- seed`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/seed.ts backend/src/helper/regionais.ts backend/tests/seed.test.ts
git commit -m "feat(backend): seed de usuários, municípios e benefícios"
```

---

## Task 7: Frontend — scaffold Vite + Tailwind + styled-components + tema

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/.env.example`, `frontend/index.html`, `frontend/vitest.setup.ts`
- Create: `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/Styles/tokens.ts`, `frontend/src/Styles/theme.ts`, `frontend/src/Styles/GlobalStyle.ts`, `frontend/src/App/theme/ThemeModeContext.tsx`, `frontend/src/App/App.tsx`
- Test: `frontend/src/App/App.test.tsx`

**Interfaces:**
- Produces: `App` (componente raiz); `ThemeModeProvider` + `useThemeMode(): { modo: "claro"|"escuro"; alternar(): void }`; `temaClaro`/`temaEscuro` (objetos de tema).

- [ ] **Step 1: Criar `frontend/package.json`**

```json
{
  "name": "criapesquisa-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.51.0",
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "styled-components": "^6.1.12"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vite": "^5.3.5",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Criar configs (`tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`, `index.html`, `vitest.setup.ts`)**

`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "useDefineForClassFields": true, "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx",
    "strict": true, "noUnusedLocals": true, "skipLibCheck": true, "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"]
}
```

`frontend/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: { globals: true, environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
});
```

`frontend/tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="escuro"]'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

`frontend/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`frontend/.env.example`:
```dotenv
VITE_API_URL=http://localhost:3333/api
```

`frontend/index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CriaPesquisa</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

`frontend/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Criar tokens e tema (`src/Styles/tokens.ts`, `theme.ts`)**

`src/Styles/tokens.ts`:
```ts
export const tokens = {
  claro: {
    bg: "#F1F5FB", surface: "#FFFFFF", border: "#E0EAFC", text: "#0F172A", textMuted: "#64748B",
    primary: "#1756B8", primaryDark: "#0B2D6E", accent: "#3A8EF0",
  },
  escuro: {
    bg: "#0B1220", surface: "#131C2E", border: "#24334D", text: "#E8EEF7", textMuted: "#94A3B8",
    primary: "#3A8EF0", primaryDark: "#78BBFF", accent: "#78BBFF",
  },
} as const;
```

`src/Styles/theme.ts`:
```ts
import { tokens } from "./tokens.js";

export const temaClaro = { modo: "claro", cores: tokens.claro } as const;
export const temaEscuro = { modo: "escuro", cores: tokens.escuro } as const;
export type Tema = typeof temaClaro;

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Tema {}
}
```

- [ ] **Step 4: Criar `GlobalStyle.ts`, `ThemeModeContext.tsx`, `index.css`**

`src/Styles/GlobalStyle.ts`:
```ts
import { createGlobalStyle } from "styled-components";
export const GlobalStyle = createGlobalStyle`
  body { background: ${(p) => p.theme.cores.bg}; color: ${(p) => p.theme.cores.text}; margin: 0; font-family: Inter, system-ui, sans-serif; }
`;
```

`src/App/theme/ThemeModeContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { temaClaro, temaEscuro } from "../../Styles/theme.js";
import { GlobalStyle } from "../../Styles/GlobalStyle.js";

type Modo = "claro" | "escuro";
const Ctx = createContext<{ modo: Modo; alternar: () => void } | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>(() => (localStorage.getItem("tema") as Modo) ?? "claro");
  useEffect(() => {
    localStorage.setItem("tema", modo);
    document.documentElement.setAttribute("data-theme", modo);
  }, [modo]);
  const valor = useMemo(() => ({ modo, alternar: () => setModo((m) => (m === "claro" ? "escuro" : "claro")) }), [modo]);
  return (
    <Ctx.Provider value={valor}>
      <ThemeProvider theme={modo === "claro" ? temaClaro : temaEscuro}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeMode fora do ThemeModeProvider");
  return ctx;
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Criar `src/App/App.tsx` e `src/main.tsx`**

`src/App/App.tsx`:
```tsx
import { ThemeModeProvider } from "./theme/ThemeModeContext.js";

export function App() {
  return (
    <ThemeModeProvider>
      <main>
        <h1>CriaPesquisa</h1>
      </main>
    </ThemeModeProvider>
  );
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App/App.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

- [ ] **Step 6: Escrever `src/App/App.test.tsx` (falha até instalar/implementar)**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("renderiza o título do sistema", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /criapesquisa/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Instalar deps e rodar o teste**

Run:
```bash
cd SECRIA/CriaPesquisa/frontend && npm install && npm test
```
Expected: `App.test.tsx` PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold vite + tailwind + styled-components + tema claro/escuro"
```

---

## Task 8: Frontend — axios, AuthContext, Login e rota protegida

**Files:**
- Create: `frontend/src/App/lib/axios.ts`, `frontend/src/App/lib/queryClient.ts`
- Create: `frontend/src/App/auth/AuthContext.tsx`, `frontend/src/App/auth/useAuth.ts`, `frontend/src/App/auth/ProtectedRoute.tsx`
- Create: `frontend/src/App/api/useLogin.ts`, `frontend/src/App/pages/Login.tsx`
- Test: `frontend/src/App/pages/Login.test.tsx`

**Interfaces:**
- Consumes: backend `POST /api/auth/login`, `GET /api/auth/me`.
- Produces: `api` (axios); `AuthProvider` + `useAuth(): { usuario, token, entrar(token,usuario), sair(), autenticado }`; `ProtectedRoute` (com prop opcional `papeis?: string[]`); `Login` page.

- [ ] **Step 1: Criar `lib/axios.ts` e `lib/queryClient.ts`**

`src/App/lib/axios.ts`:
```ts
import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(error);
  }
);
```

`src/App/lib/queryClient.ts`:
```ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
```

- [ ] **Step 2: Criar `auth/AuthContext.tsx` e `auth/useAuth.ts`**

`src/App/auth/AuthContext.tsx`:
```tsx
import { createContext, useMemo, useState, type ReactNode } from "react";

export type Usuario = { id: string; nome: string; email: string; papel: string };
export type AuthValor = { usuario: Usuario | null; token: string | null; autenticado: boolean; entrar: (t: string, u: Usuario) => void; sair: () => void };

export const AuthCtx = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? (JSON.parse(raw) as Usuario) : null;
  });
  const valor = useMemo<AuthValor>(() => ({
    usuario, token, autenticado: Boolean(token),
    entrar: (t, u) => { localStorage.setItem("token", t); localStorage.setItem("usuario", JSON.stringify(u)); setToken(t); setUsuario(u); },
    sair: () => { localStorage.removeItem("token"); localStorage.removeItem("usuario"); setToken(null); setUsuario(null); },
  }), [usuario, token]);
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}
```

`src/App/auth/useAuth.ts`:
```ts
import { useContext } from "react";
import { AuthCtx } from "./AuthContext.js";

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Criar `auth/ProtectedRoute.tsx` e `api/useLogin.ts`**

`src/App/auth/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export function ProtectedRoute({ papeis }: { papeis?: string[] }) {
  const { autenticado, usuario } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  if (papeis && usuario && !papeis.includes(usuario.papel)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

`src/App/api/useLogin.ts`:
```ts
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios.js";
import type { Usuario } from "../auth/AuthContext.js";

export function useLogin() {
  return useMutation({
    mutationFn: async (dados: { email: string; senha: string }) => {
      const { data } = await api.post<{ token: string; usuario: Usuario }>("/auth/login", dados);
      return data;
    },
  });
}
```

- [ ] **Step 4: Criar `pages/Login.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../api/useLogin.js";
import { useAuth } from "../auth/useAuth.js";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { mutateAsync, isPending } = useLogin();
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      const { token, usuario } = await mutateAsync({ email, senha });
      entrar(token, usuario);
      navigate("/");
    } catch {
      setErro("E-mail ou senha inválidos");
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label="login">
      <h1>Entrar</h1>
      <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={isPending}>{isPending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
```

- [ ] **Step 5: Escrever `pages/Login.test.tsx` (falha)**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login.js";
import { AuthProvider } from "../auth/AuthContext.js";
import { queryClient } from "../lib/queryClient.js";
import { api } from "../lib/axios.js";

vi.spyOn(api, "post");
beforeEach(() => { localStorage.clear(); queryClient.clear(); });

function renderLogin() {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><MemoryRouter><Login /></MemoryRouter></AuthProvider>
    </QueryClientProvider>
  );
}

describe("Login", () => {
  it("mostra erro quando as credenciais são inválidas", async () => {
    (api.post as any).mockRejectedValueOnce(new Error("401"));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "x@y.z");
    await userEvent.type(screen.getByLabelText(/senha/i), "errada");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/inválidos/i);
  });

  it("guarda o token ao logar com sucesso", async () => {
    (api.post as any).mockResolvedValueOnce({ data: { token: "abc", usuario: { id: "1", nome: "A", email: "x@y.z", papel: "ADMIN" } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "x@y.z");
    await userEvent.type(screen.getByLabelText(/senha/i), "cria123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await vi.waitFor(() => expect(localStorage.getItem("token")).toBe("abc"));
  });
});
```

- [ ] **Step 6: Rodar o teste (deve passar)**

Run: `cd SECRIA/CriaPesquisa/frontend && npm test -- Login`
Expected: PASS (2 testes).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App
git commit -m "feat(frontend): axios, auth context, login e rota protegida"
```

---

## Task 9: Frontend — layout (Sidebar/Topbar/ThemeToggle) + roteamento

**Files:**
- Create: `frontend/src/Components/layout/Sidebar.tsx`, `Topbar.tsx`, `Layout.tsx`
- Create: `frontend/src/Components/ui/ThemeToggle.tsx`
- Create: `frontend/src/App/pages/Dashboard.tsx` (placeholder), `frontend/src/App/router.tsx`
- Modify: `frontend/src/App/App.tsx` (montar providers + router)
- Test: `frontend/src/Components/layout/Layout.test.tsx`

**Interfaces:**
- Consumes: `useThemeMode` (Task 7); `useAuth` (Task 8); `ProtectedRoute` (Task 8); `Login` (Task 8).
- Produces: `Layout` (sidebar + topbar + `<Outlet/>`); `ThemeToggle`; `router` (createBrowserRouter); páginas placeholder.

- [ ] **Step 1: Criar `ui/ThemeToggle.tsx`**

```tsx
import { useThemeMode } from "../../App/theme/ThemeModeContext.js";

export function ThemeToggle() {
  const { modo, alternar } = useThemeMode();
  return (
    <button type="button" onClick={alternar} aria-label="alternar tema">
      {modo === "claro" ? "🌙 Escuro" : "☀️ Claro"}
    </button>
  );
}
```

- [ ] **Step 2: Criar `layout/Sidebar.tsx` e `layout/Topbar.tsx`**

`src/Components/layout/Sidebar.tsx`:
```tsx
import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/", rotulo: "Dashboard" },
  { to: "/entrevistas", rotulo: "Entrevistas" },
  { to: "/criancas", rotulo: "Crianças" },
  { to: "/gestantes", rotulo: "Gestantes" },
  { to: "/saude", rotulo: "Saúde" },
  { to: "/alimentacao", rotulo: "Alimentação" },
  { to: "/indicadores", rotulo: "Indicadores" },
];

export function Sidebar() {
  return (
    <nav aria-label="navegação principal">
      <strong>CRIA.</strong>
      <ul>
        {ITENS.map((i) => (
          <li key={i.to}><NavLink to={i.to} end={i.to === "/"}>{i.rotulo}</NavLink></li>
        ))}
      </ul>
    </nav>
  );
}
```

`src/Components/layout/Topbar.tsx`:
```tsx
import { ThemeToggle } from "../ui/ThemeToggle.js";
import { useAuth } from "../../App/auth/useAuth.js";

export function Topbar() {
  const { usuario, sair } = useAuth();
  return (
    <header>
      <span>Visão Geral — Cartão CRIA</span>
      <div>
        <ThemeToggle />
        <span>{usuario?.nome}</span>
        <button type="button" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Criar `layout/Layout.tsx` e `pages/Dashboard.tsx`**

`src/Components/layout/Layout.tsx`:
```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { Topbar } from "./Topbar.js";

export function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Topbar />
        <div style={{ padding: 24 }}><Outlet /></div>
      </div>
    </div>
  );
}
```

`src/App/pages/Dashboard.tsx`:
```tsx
export function Dashboard() {
  return <h1>Dashboard</h1>;
}
```

- [ ] **Step 4: Criar `App/router.tsx`**

```tsx
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../Components/layout/Layout.js";
import { ProtectedRoute } from "./auth/ProtectedRoute.js";
import { Login } from "./pages/Login.js";
import { Dashboard } from "./pages/Dashboard.js";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { element: <Layout />, children: [{ path: "/", element: <Dashboard /> }] },
    ],
  },
]);
```

- [ ] **Step 5: Atualizar `App/App.tsx` para montar tudo**

```tsx
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "./theme/ThemeModeContext.js";
import { AuthProvider } from "./auth/AuthContext.js";
import { queryClient } from "./lib/queryClient.js";
import { router } from "./router.js";

export function App() {
  return (
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>
  );
}
```

- [ ] **Step 6: Escrever `Components/layout/Layout.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout.js";
import { ThemeModeProvider } from "../../App/theme/ThemeModeContext.js";
import { AuthProvider } from "../../App/auth/AuthContext.js";

function renderLayout() {
  return render(
    <ThemeModeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes><Route element={<Layout />}><Route path="/" element={<p>conteúdo</p>} /></Route></Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

describe("Layout", () => {
  it("mostra a navegação e o conteúdo", () => {
    renderLayout();
    expect(screen.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("alterna o tema ao clicar no toggle", async () => {
    renderLayout();
    expect(document.documentElement.getAttribute("data-theme")).toBe("claro");
    await userEvent.click(screen.getByRole("button", { name: /alternar tema/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("escuro");
  });
});
```

- [ ] **Step 7: Rodar o teste (deve passar)**

Run: `cd SECRIA/CriaPesquisa/frontend && npm test -- Layout`
Expected: PASS (2 testes).

- [ ] **Step 8: Rodar toda a suíte + build de sanidade**

Run: `cd SECRIA/CriaPesquisa/frontend && npm test && npm run build`
Expected: todos os testes PASS; build sem erros.

- [ ] **Step 9: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): layout (sidebar/topbar), toggle de tema e roteamento protegido"
```

---

## Task 10: README e verificação de ponta a ponta

**Files:**
- Create: `SECRIA/CriaPesquisa/README.md`

- [ ] **Step 1: Escrever `README.md` com o passo a passo**

Conteúdo (resumo obrigatório): pré-requisitos (Node 20+, Docker); backend (`cp .env.example .env`, `docker compose up -d postgres`, `npm install`, `npm run prisma:migrate`, `npm run seed`, `npm run dev`); frontend (`cp .env.example .env`, `npm install`, `npm run dev`); usuários padrão (`admin@cria.al` / `entrevistador@cria.al` / `visualizador@cria.al`, senha `cria123`); comandos de teste (`npm test` em cada pasta).

- [ ] **Step 2: Verificação manual de ponta a ponta**

Run (dois terminais):
```bash
# terminal 1
cd SECRIA/CriaPesquisa/backend && npm run dev
# terminal 2
cd SECRIA/CriaPesquisa/frontend && npm run dev
```
Checklist:
- Abrir `http://localhost:5173` → redireciona para `/login`.
- Logar com `admin@cria.al` / `cria123` → cai no Dashboard com sidebar/topbar.
- Clicar no toggle → tema muda e persiste após reload.
- Recarregar → segue logado (token no localStorage).
- Botão "Sair" → volta ao login.

- [ ] **Step 3: Rodar as suítes completas dos dois lados**

Run:
```bash
cd SECRIA/CriaPesquisa/backend && npm test
cd SECRIA/CriaPesquisa/frontend && npm test
```
Expected: todos os testes PASS.

- [ ] **Step 4: Commit**

```bash
git add SECRIA/CriaPesquisa/README.md
git commit -m "docs: README com setup e verificação da fase 1"
```

---

## Self-Review (feita ao escrever o plano)

- **Cobertura do spec (Fase 1):** scaffold back/front ✓ (T1,T7), docker-compose+schema completo ✓ (T2), auth JWT+papéis ✓ (T3,T4,T5), auditoria — schema criado (T2); serviço de auditoria em si é usado nas escritas das Fases 3–4 (Fase 1 não tem escrita de entrevista), então o *helper* de auditoria foi movido para a Fase 3 junto do CRUD (ajuste vs. §11 do spec — registrado aqui). Seed ✓ (T6), tema claro/escuro ✓ (T7,T9), layout+rota protegida ✓ (T8,T9), README+E2E ✓ (T10).
- **Placeholders:** o único ponto a "completar" é o mapa de regionais em T6/Step 2 — mas a fonte exata (app.py linhas 23–34) está citada e deve ser portada integralmente; não é um TODO de lógica.
- **Consistência de tipos:** `entrar(token, usuario)`/`sair()`/`autenticado` usados igualmente em AuthContext (T8) e consumidores (T8,T9); `useThemeMode(): { modo, alternar }` idem (T7,T9); `verificarToken`/`gerarToken` idem (T3→T4,T5). `REGIONAL_POR_MUNICIPIO` definido em T6/Step2 e consumido em T6/Step1.

**Nota de ajuste ao spec:** o serviço de auditoria (`LogAlteracao`/`EntrevistaVersao`) foi realocado para a Fase 3 (onde há operações de escrita de entrevista), pois na Fase 1 não há o que auditar além de login. As *tabelas* já são criadas na Fase 1 (T2). As demais fases (2–4) terão planos próprios.
