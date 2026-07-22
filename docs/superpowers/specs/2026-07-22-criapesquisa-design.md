# CriaPesquisa — Documento de Design

- **Data:** 2026-07-22
- **Autora do produto:** Maryana (SECRIA/SECTI-AL) — QA e design/front-end
- **Local do projeto:** `SECRIA/CriaPesquisa/`
- **Base de referência:** `dashboard_cria_v2_mapa_alagoas_filtros_graficos.html` e o backend Python existente em `SECRIA/dashboard_cria_postgresql/`.

---

## 1. Objetivo

Sistema web full-stack para a **pesquisa de campo do Cartão CRIA**. A equipe cadastra entrevistas reais de beneficiários (crianças e gestantes) com os mesmos campos dos formulários Google, e um **dashboard agrega esses dados em tempo real** — mapa de Alagoas, KPIs, gráficos analíticos e indicadores (MCC/MCG/MCB, TRIA, NPS).

Substitui o protótipo HTML (dados sintéticos) por um sistema real: persistência em PostgreSQL, autenticação com papéis, CRUD de entrevistas, **trilha de auditoria e versionamento** e agregações calculadas a partir dos registros.

### Objetivos (in scope)

1. Autenticação por e-mail/senha com três papéis (admin, entrevistador, visualizador).
2. CRUD completo de entrevistas (criança e gestante), com validação.
3. Dashboard de leitura com KPIs, mapa, tabelas e gráficos — **agregados de dados reais**.
4. Páginas de análise: Crianças, Gestantes, Saúde, Alimentação, Indicadores.
5. Tema claro/escuro com toggle e persistência.
6. **Trilha de auditoria (log de alterações)** + **versionamento e soft-delete** de entrevistas — nada é apagado de forma irreversível; toda alteração fica registrada (quem, quando, antes/depois) e é possível restaurar a versão mais recente. Proteção contra exclusão de dados por funcionário desligado.
7. Seed de dados (usuários padrão + entrevistas de exemplo + dados administrativos por município).
8. Ambiente de desenvolvimento reprodutível (docker-compose para Postgres).

### Fora de escopo (não fazer agora)

- Integração automática com Google Forms/Sheets (importação manual/CSV fica para depois).
- Deploy em produção / CI-CD (o projeto é dev-first; deploy é fase futura).
- Aplicativo mobile.
- Relatórios em PDF exportáveis (pode virar fase futura).

---

## 2. Stack técnica

### Frontend
- **React 18 + TypeScript**, build com **Vite**.
- **Tailwind CSS** (layout e utilitários) + **styled-components** (peças tematizadas / tokens claro-escuro).
- **axios** (com interceptors de token e erro) + **TanStack Query** (estado de servidor/cache).
- **React Router v6** (navegação entre páginas).
- **react-hook-form + zod** (formulários de CRUD com validação).
- **react-chartjs-2 (Chart.js 4)** para gráficos — escolhido por cobrir bem rosca/radar/barras/linha do dashboard e permitir tematização; aplicando boas práticas de dataviz (paleta consistente, contraste em ambos os temas).
- Sem React-Bootstrap (decisão: componentes interativos — modal, toast, dropdown, paginação — feitos sob medida).

### Backend
- **Node.js + TypeScript**, framework **Express**.
- **Prisma ORM** + **PostgreSQL**.
- **zod** para validação de payloads.
- **jsonwebtoken** (JWT) + **bcrypt** (hash de senha).
- **helmet**, **cors**, **pino** (logging).

### Testes
- Backend: **Vitest + Supertest** (integração de rotas contra um banco de teste).
- Frontend: **Vitest + React Testing Library**.
- Desenvolvimento guiado por testes (TDD) onde couber.

### Infra dev
- **docker-compose.yml** sobe o PostgreSQL local.
- `.env.example` em `frontend/` e `backend/`.

---

## 3. Estrutura de pastas

```text
SECRIA/CriaPesquisa/
├─ docker-compose.yml
├─ README.md
├─ docs/superpowers/specs/2026-07-22-criapesquisa-design.md
│
├─ backend/
│  ├─ package.json  tsconfig.json  .env.example
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  ├─ migrations/
│  │  └─ seed.ts
│  ├─ data/
│  │  └─ seed_municipios.json
│  └─ src/
│     ├─ server.ts                (inicializa o servidor: listen na porta)
│     ├─ app.ts                   (monta o Express: middlewares globais + rotas)
│     ├─ config/                  (env, prisma client, constantes)
│     ├─ controllers/             (auth, usuarios, entrevistas, municipios, dashboard, logs)
│     ├─ helper/                  (regionais, período, agregação, formatters, auditoria, validators zod)
│     ├─ middleware/              (auth, roles, validate, errorHandler)
│     ├─ models/                  (camada de acesso a dados: repositórios via Prisma + tipos de domínio)
│     └─ routes/                  (roteadores por recurso + index que os agrega em /api)
│
└─ frontend/
   ├─ public/                     (imagens e ícones — logos, icones-cria/*.svg, alagoas-municipios.geojson)
   ├─ index.html
   ├─ package.json  tsconfig.json  vite.config.ts  tailwind.config.ts  .env.example
   └─ src/
      ├─ main.tsx                 (entry: monta o React + providers)
      ├─ index.css                (diretivas do Tailwind + estilos base)
      ├─ App/                     (App.tsx, router e providers da aplicação)
      │  ├─ pages/                (Login, Dashboard, Entrevistas, EntrevistaForm, Criancas,
      │  │                         Gestantes, Saude, Alimentacao, Indicadores, Usuarios, Logs)
      │  ├─ auth/                 (AuthContext, ProtectedRoute, useAuth)
      │  ├─ api/                  (hooks TanStack Query por recurso)
      │  └─ lib/                  (axios client, queryClient)
      ├─ Components/
      │  ├─ layout/               (Sidebar, Topbar, FiltersBar, Layout)
      │  ├─ ui/                   (Card, Kpi, Tag, Modal, Toast, Table, Button, Select…)
      │  ├─ charts/               (wrappers tematizados de Chart.js)
      │  └─ mapa/                 (MapaAlagoas — projeção do GeoJSON)
      └─ Styles/                  (tokens claro/escuro, ThemeProvider, GlobalStyle, base styled-components)
```

**Notas sobre a organização:**
- `backend/src/models/` é a **camada de acesso a dados** (repositórios que encapsulam o Prisma Client + tipos de domínio). O schema físico do banco fica em `prisma/schema.prisma` (fonte de verdade das tabelas); os controllers nunca chamam o Prisma direto — passam pelos repositórios em `models/`.
- `backend/src/helper/` guarda utilitários puros e sem estado: mapa de regionais, cálculo de período, funções de agregação/percentual, formatadores, o serviço de **auditoria** e os **schemas zod** de validação.
- No frontend, `src/App/` concentra o shell da aplicação (App.tsx, rotas, providers) e suas subpastas de apoio (`pages`, `auth`, `api`, `lib`); `Components/` são peças reutilizáveis; `Styles/` centraliza o tema. Assets estáticos (imagens, ícones, GeoJSON) ficam em `public/`.

---

## 4. Modelo de dados (Prisma / PostgreSQL)

> Convenção: colunas em `camelCase` no Prisma. Enums em MAIÚSCULO.

### 4.1 `Usuario`
| campo | tipo | notas |
|---|---|---|
| id | uuid PK | |
| nome | text | |
| email | text unique | |
| senhaHash | text | bcrypt |
| papel | enum `PapelUsuario` | `ADMIN` \| `ENTREVISTADOR` \| `VISUALIZADOR` |
| ativo | boolean | default true (desligamento = `ativo=false`, não exclusão) |
| createdAt / updatedAt | timestamptz | |

### 4.2 `MunicipioMensal` (dados administrativos do programa)
Reaproveita o schema atual. **Não** vem de entrevista — alimenta KPIs, mapa, top municípios e evolução do investimento.

| campo | tipo |
|---|---|
| id | serial PK |
| ano | int |
| mes | int (1–12) |
| mesNome | text |
| municipio | text |
| regional | text |
| totalBeneficiarios | int |
| criancas | int |
| gestantes | int |
| valorTotal | float |
| rendaMedia | float |

Índice único `(ano, mes, municipio)`; índices em `(ano, mes)`, `regional`, `municipio`.

### 4.3 `BeneficioComposicao` (administrativo, seed)
Alimenta o card "Benefícios Acumulados" (Bolsa Família, BF+PAIF, …). Simples: `id, ano, mes, label, quantidade`. Semeado; não é entrevista.

### 4.4 `Entrevista` (campos comuns aos dois tipos)
| campo | tipo | notas |
|---|---|---|
| id | uuid PK | |
| nome | text | nome do(a) entrevistado(a)/beneficiária |
| cpf | text | validado (formato) |
| nis | text? | opcional |
| tipo | enum `TipoEntrevista` | `CRIANCA` \| `GESTANTE` |
| municipio | text | |
| regional | text | derivado do município (mapa de regionais) |
| zona | enum | `URBANA` \| `RURAL` |
| renda | float | renda familiar (R$) |
| status | enum `StatusEntrevista` | `COMPLETO` \| `PENDENTE` \| `REVISAO` |
| data | date | data da entrevista |
| ano / mes | int | derivados de `data` (para filtros/índices) |
| satisfacao | int? | 1–5 |
| nps | int? | 0–10 |
| principalUsoBeneficio | text? | ver enum de usos |
| dificuldadesRelatadas | text[] | multi-select (gráfico de dificuldades) |
| canalDivulgacao | text? | como soube do CRIA |
| contribSegFinanceira | int? | 0–5 |
| contribAlimentacao | int? | 0–5 |
| contribSaude | int? | 0–5 |
| contribBemEstarEmocional | int? | 0–5 |
| observacoes | text? | livre |
| versaoAtual | int | default 1 (incrementa a cada update) |
| createdById | uuid FK → Usuario | quem cadastrou |
| updatedById | uuid? FK → Usuario | quem alterou por último |
| deletedAt | timestamptz? | **soft-delete** (null = ativa) |
| deletedById | uuid? FK → Usuario | quem excluiu (soft) |
| createdAt / updatedAt | timestamptz | |

Índices: `(ano, mes)`, `regional`, `tipo`, `status`, `deletedAt`. **Todas as leituras de dashboard e listagem ignoram registros com `deletedAt` preenchido**; só o admin vê/restaura excluídos.

### 4.5 `DetalheCrianca` (1:1 com Entrevista, quando `tipo = CRIANCA`)
**Responsável:** parentesco (`Mãe`/`Pai`/`Avós`/`Outro`), idadeResponsavel, racaCor (`Branca`/`Preta`/`Parda`/`Amarela`/`Indígena`), orientacaoSexual, sexoBiologicoResponsavel (`Masculino`/`Feminino`/`Intersexo`), identidadeGenero (`Cisgênero`/`Transgênero`/`Outro`), estadoCivil, escolaridade, gruposTradicionais (text[]), moradia (`Própria`/`Alugada`/`Cedida`), pessoasResidencia (int), maeSolo (bool).

**Criança:** nomeCrianca, cpfCrianca?, dataNascimentoCrianca, sexoBiologicoCrianca, idadeCrianca (int, derivado), educacaoInfantil (`Creche CRIA`/`Outra creche`/`Pré-escola`/`Não frequenta`), pesoAoNascer (`Peso normal`/`Baixo peso`), aleitamento (`Exclusivo até 6m`/`Não exclusivo`/`Não amamentou`), deficienciaSindrome (text, default "Não"), consultasPuericulturaAno (int).

**Saúde (antes/após CRIA):** vacinacaoAntes/vacinacaoApos (`Sim`/`Não`), odontoAntes/odontoApos (`Sim`/`Não`), suplementoFerro (`Sim`/`Não`), vitaminaA (`Sim`/`Não`).

**Alimentação:** refeicoesAntes/refeicoesApos (`Sempre`/`Quase sempre`/`Raramente`/`Nunca`).

**Programas (antes/após):** criancaFelizAntes/criancaFelizApos, crasAntes/crasApos, visitasCrasAno (int, para índice MCC).

### 4.6 `DetalheGestante` (1:1 com Entrevista, quando `tipo = GESTANTE`)
**Sociodemográfico:** idade, racaCor, orientacaoSexual, sexoBiologico, identidadeGenero, estadoCivil, escolaridade, gruposTradicionais (text[]), moradia, pessoasResidencia, maeSolo.

**Reprodutivo / pré-natal:** gestacao (`1ª`…`5ª`/`Superior a 5`), partos (`0`…`6+`), planejadaAnterior (`Sim`/`Não`), planejadaAtual (`Sim`/`Não`), inicioPreNatalAnterior/inicioPreNatalAtual (`Antes de 12 semanas`/`Após 12 semanas`/`Não fez`), riscoGestacional (`Habitual/baixo risco`/`Alto risco`), vacinacao (`Atualizada`/`Atrasada`).

**Exames obrigatórios (realizados na gestação atual — boolean cada):** hemograma, glicemia, hivSifilis, ultrassom, urina. *(Lista canônica; confirmar rótulos contra a ficha técnica.)*

**Alimentação:** refeicoesAntes/refeicoesApos.

**Programas (antes/após):** criancaFelizAntes/criancaFelizApos, crasAntes/crasApos, visitasCrasAno (int, para índice MCG).

### 4.7 `LogAlteracao` (trilha de auditoria)
Registro imutável de **toda** operação de escrita (create/update/delete/restore) em entrevistas, usuários e importações administrativas.

| campo | tipo | notas |
|---|---|---|
| id | uuid PK | |
| entidade | text | ex.: `Entrevista`, `Usuario`, `MunicipioMensal` |
| entidadeId | text | id do registro afetado |
| acao | enum `AcaoLog` | `CREATE` \| `UPDATE` \| `DELETE` \| `RESTORE` |
| usuarioId | uuid FK → Usuario | quem fez |
| dadosAntes | jsonb? | snapshot anterior (null em CREATE) |
| dadosDepois | jsonb? | snapshot novo (null em DELETE) |
| ip | text? | origem da requisição |
| createdAt | timestamptz | |

Índices: `(entidade, entidadeId)`, `usuarioId`, `createdAt`. Nunca é editável/apagável pela aplicação (append-only).

### 4.8 `EntrevistaVersao` (histórico de versões / restauração)
A cada `create`/`update` de uma entrevista, grava-se um snapshot completo (entrevista + detalhe). Permite **restaurar a versão mais recente** mesmo que alguém altere/exclua o registro.

| campo | tipo | notas |
|---|---|---|
| id | uuid PK | |
| entrevistaId | uuid FK → Entrevista | |
| versao | int | sequencial por entrevista |
| snapshot | jsonb | entrevista + detalhe completos |
| usuarioId | uuid FK → Usuario | autor da versão |
| createdAt | timestamptz | |

Índice único `(entrevistaId, versao)`.

**Política de proteção de dados (resumo):**
- Excluir entrevista = **soft-delete** (`deletedAt`), reversível. Purge físico não é exposto na API.
- Usuário desligado = `ativo=false` (não some do histórico; seus registros e logs permanecem).
- Toda escrita gera `LogAlteracao`; toda versão de entrevista fica em `EntrevistaVersao`.
- Restauração (admin) reativa o registro e/ou reaplica a última versão válida.

---

## 5. Mapeamento campo → gráfico (agregações)

Todas as agregações aceitam filtros `ano`, `mes`, `tipo`, `regional` e **ignoram entrevistas com `deletedAt`**. As de **KPI/mapa/investimento** vêm de `MunicipioMensal`; as **analíticas** vêm de `Entrevista`/detalhes.

| Elemento do dashboard | Fonte | Agregação |
|---|---|---|
| KPIs (total, crianças, gestantes, municípios, valor) | MunicipioMensal | SUM/AVG por período/escopo |
| Mapa de Alagoas (cor por município) | MunicipioMensal | SUM(totalBeneficiarios) por município |
| Top municípios | MunicipioMensal | ranking por totalBeneficiarios |
| Evolução do investimento | MunicipioMensal | SUM(valorTotal) por mês/ano |
| Benefícios acumulados | BeneficioComposicao | por label |
| Distribuição racial | detalhe.racaCor | COUNT % por raça |
| Zona rural × urbana | Entrevista.zona | COUNT % |
| Faixa etária | idadeCrianca (0–5) / idade gestante em faixas | COUNT por faixa |
| Estado civil / Escolaridade | detalhe | COUNT % |
| Alimentação antes/depois | detalhe.refeicoesAntes/Apos | distribuição % |
| Saúde infantil (radar) | vacinação/odonto/ferro/vitA/puericultura/CRAS | % "Sim"/normalizado, antes×após |
| Aleitamento / Educação infantil | DetalheCrianca | COUNT % |
| Início pré-natal antes/atual | DetalheGestante.inicioPreNatal* | distribuição % |
| Exames obrigatórios | DetalheGestante (booleans) | % realizados |
| Perfil reprodutivo | DetalheGestante.gestacao | distribuição % |
| Usos do benefício | Entrevista.principalUsoBeneficio | COUNT % |
| Dificuldades relatadas | Entrevista.dificuldadesRelatadas | COUNT % (multi) |
| Canais de divulgação | Entrevista.canalDivulgacao | COUNT % |
| Contribuição p/ bem-estar | Entrevista.contrib* | AVG 0–5 por dimensão, por tipo |
| NPS (criança/gestante) | Entrevista.nps | promotores(9–10)/passivos(7–8)/detratores(0–6) |

### Indicadores derivados (fórmulas explícitas)
- **CVAC** (cobertura vacinal) = proporção de entrevistas com vacinação em dia (0–1).
- **CPUER** (puericultura) = min(1, média(consultasPuericulturaAno) / 6).
- **CPRE** (pré-natal) = proporção com início do pré-natal antes de 12 semanas (0–1).
- **VCRAS** = média(visitasCrasAno) (escala observada ~0–2).
- **MCC** = (VCRAS×3 + CVAC×5 + CPUER×5) / 13  *(exibido em pontos /13 como no HTML)*.
- **MCG** = (VCRAS×3 + CVAC×5 + CPRE×5) / 13.
- **MCB** = (MCC + MCG) / 2.
- **TRIA** (insegurança alimentar): classificação derivada de `refeicoesApos` (Sempre→Segurança; Quase sempre→IA leve; Raramente→IA moderada; Nunca→IA grave). *(Confirmar contra a ficha técnica — pode existir escala EBIA específica.)*
- **IDMCC** (radar multidimensional): composição normalizada de segurança alimentar, MCC/MCG, vacinação, pré-natal/puericultura, CRAS e bem-estar.

> As fórmulas replicam o HTML/`app.py`. Onde o insumo real ainda não existe como campo (VCRAS, TRIA/EBIA), o spec define uma aproximação e marca para validação — ver §11.

---

## 6. API REST

Prefixo `/api`. Respostas JSON. Erros no formato `{ error: { code, message, details? } }`.

### Auth
- `POST /api/auth/login` → `{ token, usuario }`
- `GET /api/auth/me` → usuário do token

### Dashboard (leitura) — aceitam `?ano&mes&tipo&regional`
- `GET /api/filters` → `{ anos, meses, regionais, tipos }`
- `GET /api/resumo` → `{ meta, kpis }`
- `GET /api/municipios` → `{ meta, municipios[] }`
- `GET /api/charts` → `{ meta, charts }` (todas as séries analíticas agregadas)

### Entrevistas (CRUD + versionamento)
- `GET /api/entrevistas` → filtros (`ano,mes,regional,tipoEntrevista,status,q`) + paginação → `{ meta, total, page, entrevistas[] }` (só ativas)
- `GET /api/entrevistas/:id` → entrevista + detalhe tipado
- `POST /api/entrevistas` (entrevistador/admin) → cria entrevista + detalhe (gera versão 1 + log CREATE)
- `PUT /api/entrevistas/:id` (entrevistador/admin) → atualiza (nova versão + log UPDATE)
- `DELETE /api/entrevistas/:id` → **soft-delete** (entrevistador só as próprias; admin qualquer; log DELETE)
- `GET /api/entrevistas/:id/versoes` (entrevistador/admin) → histórico de versões
- `POST /api/entrevistas/:id/restaurar` (admin) → restaura (reativa e/ou reaplica última versão; log RESTORE)

### Admin
- `GET/POST/PUT/DELETE /api/usuarios` (admin) — "delete" desativa (`ativo=false`)
- `GET /api/entrevistas/excluidas` (admin) → lista soft-deleted
- `GET /api/logs` (admin) → trilha de auditoria (filtros por entidade/usuário/período, paginado)
- `POST /api/municipios/importar` (admin — CSV de MunicipioMensal)

### Regras de papéis (middleware)
- **VISUALIZADOR:** somente rotas GET de dashboard/entrevistas.
- **ENTREVISTADOR:** + CRUD de entrevistas (delete/soft só das próprias) + ver versões.
- **ADMIN:** tudo, incluindo usuários, restauração, logs e importação administrativa.

Validação de todos os corpos com zod; `ano/mes/regional/derivados` calculados no servidor. Toda rota de escrita passa pelo serviço de auditoria (helper) que grava `LogAlteracao` e, para entrevistas, `EntrevistaVersao`.

---

## 7. Frontend — páginas e componentes

**Layout global:** Sidebar (navegação por seções), Topbar (filtros de período/tipo, toggle de tema, menu do usuário). Rotas protegidas por autenticação e papel.

- **Login** — e-mail/senha; guarda token; redireciona.
- **Dashboard (Visão Geral)** — 5 KPIs, distribuição racial, zona, faixa etária, mapa de Alagoas, top municípios, benefícios, investimento, estado civil, escolaridade.
- **Entrevistas** — tabela com filtros/busca/paginação; botões novo/editar/excluir (conforme papel); modal de detalhe com **histórico de versões**; **EntrevistaForm** (criança/gestante) com react-hook-form + zod, campos condicionais por tipo, seções colapsáveis (perfil, saúde, alimentação, programas, satisfação).
- **Crianças** — indicadores + gráficos (alimentação antes/depois, saúde radar, aleitamento, educação).
- **Gestantes** — indicadores + gráficos (início pré-natal, alimentação, exames, perfil reprodutivo).
- **Saúde** — MCC/MCG (cards com fórmula), TRIA, IDMCC.
- **Alimentação** — frequência de refeições antes/depois, usos do benefício, tendência de insegurança.
- **Indicadores** — NPS criança/gestante, MCB, contribuição para bem-estar, dificuldades, canais.
- **Usuários** (admin) — listar/criar/editar/desativar.
- **Logs** (admin) — trilha de auditoria + entrevistas excluídas (restaurar).

**Componentes de UI reutilizáveis:** Card, KpiCard, Tag/StatusTag, Modal, Toast, DataTable (com paginação), Select/Input/Field, Button, ThemeToggle. **Charts:** wrappers tematizados (Doughnut, Bar, RadarChart, LineChart) que leem os tokens do tema. **MapaAlagoas:** componente SVG que projeta o GeoJSON, com tooltip e recoloração por dados/tema.

**Dados de servidor:** hooks TanStack Query por recurso (`useResumo`, `useMunicipios`, `useCharts`, `useEntrevistas`, `useEntrevista`, `useLogs`, mutations de CRUD/restaurar), com invalidação de cache após mutações. Filtros globais em contexto/estado de URL.

---

## 8. Tema claro/escuro

Design tokens (cores, sombras, raios) em CSS variables + tipos TS, com dois conjuntos (claro/escuro). `ThemeProvider` (styled-components) aplica o tema; toggle na topbar salva preferência em `localStorage` e respeita `prefers-color-scheme` no primeiro acesso. Gráficos e mapa recebem cores derivadas dos tokens para recolorir automaticamente. Paleta base azul CRIA do HTML como tema claro; tema escuro derivado com contraste adequado (acessibilidade).

---

## 9. Autenticação e segurança

- Senhas com **bcrypt**; login emite **JWT** (expiração ~8h) com `{ sub, papel }`.
- Frontend guarda token; interceptor axios injeta `Authorization` e, em 401, desloga e redireciona ao login.
- Backend: middleware `auth` (valida token) + `roles` (autoriza por papel). `helmet` e `cors` configurados.
- **Auditoria e proteção de dados:** toda escrita registra `LogAlteracao` (append-only) com autor e antes/depois; entrevistas mantêm `EntrevistaVersao`; exclusão é soft e restaurável (admin). Dados sensíveis (CPF/NIS) não aparecem em logs de aplicação (pino); snapshots de auditoria que os contêm têm acesso restrito ao admin. Considerar mascaramento de CPF/NIS na UI do visualizador (ver §12).

---

## 10. Seed e ambiente de desenvolvimento

- `docker-compose.yml` sobe PostgreSQL (db `criapesquisa`, credenciais em `.env`).
- `prisma migrate` cria o schema; `prisma db seed` popula:
  1. **Usuários padrão:** um admin, um entrevistador, um visualizador (senhas em `.env.example`).
  2. **MunicipioMensal + BeneficioComposicao:** a partir de `data/seed_municipios.json` (reaproveitado), gerando anos/meses com os fatores do backend atual.
  3. **~243 entrevistas de exemplo** normalizadas (crianças e gestantes) para o dashboard não nascer vazio — geração determinística (com versão 1 e log CREATE).
- README com passo a passo (subir DB, migrar, semear, rodar backend, rodar frontend).

---

## 11. Fases de implementação

1. **Fase 1 — Fundação:** scaffold backend/frontend (estrutura de pastas da §3), docker-compose, Prisma schema + migração + seed, auth (login, papéis), serviço de **auditoria** (helper), layout base (sidebar/topbar/tema), rota protegida. Testes de auth.
2. **Fase 2 — Dashboard de leitura:** endpoints `filters/resumo/municipios/charts` com agregação real (ignorando soft-deleted); página Dashboard (KPIs, mapa, tabelas, gráficos principais). Testes de agregação.
3. **Fase 3 — CRUD + versionamento:** endpoints POST/PUT/DELETE (soft) + restaurar + versões + logs, com validação e auditoria; página Entrevistas (lista, filtros, form criança/gestante, detalhe + histórico). Testes de CRUD, soft-delete, restauração e log.
4. **Fase 4 — Análises, indicadores e polish:** páginas Crianças, Gestantes, Saúde, Alimentação, Indicadores; índices derivados (MCC/MCG/MCB, TRIA, IDMCC, NPS); Usuários e Logs (admin); refino visual claro/escuro; acessibilidade.

Cada fase vira um bloco no plano de implementação (writing-plans), com tarefas testáveis.

---

## 12. Premissas e questões em aberto

1. **Lista completa de campos dos formulários:** o WebFetch trouxe só a 1ª seção de cada formulário. Os campos de saúde/alimentação/programas/satisfação foram derivados do modal do HTML + `app.py`. **Validar a lista final contra a ficha técnica** (planilha) antes/junto da Fase 3.
2. **Campos de índices derivados:** VCRAS (visitas ao CRAS por ano) e a escala de insegurança alimentar (TRIA/EBIA) podem ter formato específico na ficha técnica; o spec adota uma aproximação e um campo `visitasCrasAno`. Ajustar quando confirmado.
3. **Faixa etária de gestantes:** o HTML mistura faixas por idade e por trimestre; o design adota faixas por **idade** para ambos os tipos. Confirmar se querem trimestre gestacional (exigiria campo de semanas).
4. **Benefícios acumulados / canais / dificuldades:** modelados como distribuições; "benefícios acumulados" (Bolsa Família etc.) é dado administrativo (tabela própria semeada), não vem da entrevista.
5. **CPF/NIS (LGPD):** dados sensíveis — não logados em pino; snapshots de auditoria restritos ao admin; avaliar mascaramento na UI do visualizador. Confirmar política.
6. **Retenção de logs/versões:** por padrão, sem expurgo automático (append-only). Confirmar se há política de retenção.
7. **Deploy:** fora de escopo agora; a estrutura já facilita adicionar depois.

---

## 13. Critérios de sucesso

- Login funciona para os três papéis, com autorização correta por rota.
- É possível cadastrar/editar/excluir entrevistas de criança e gestante com validação.
- **Excluir uma entrevista é soft-delete:** ela some das telas mas permanece no banco, aparece em "excluídas" (admin) e pode ser restaurada; a última versão é recuperável.
- **Toda alteração gera registro de auditoria** (quem, quando, antes/depois), inclusive tentativas de exclusão.
- Usuário desligado é desativado (não excluído); seus dados e logs permanecem íntegros.
- O dashboard reflete os dados reais das entrevistas (mudou uma entrevista → mudou o gráfico), com filtros de período/tipo/regional.
- Mapa de Alagoas colore municípios conforme os dados e responde ao tema.
- Tema claro/escuro consistente em toda a aplicação, inclusive gráficos e mapa.
- Testes de auth, CRUD, soft-delete/restauração, auditoria e agregações passando.
