# CriaPesquisa — Documento de Design (v2 — Construtor de Pesquisas)

- **Data:** 2026-07-22
- **Autora/PO:** Maryana (SECRIA/SECTI-AL) — dev full-stack, QA, requisitos e design
- **Local:** `SECRIA/CriaPesquisa/` (`frontend/` + `backend/`)
- **Mudança v2:** o escopo passou de "formulários fixos do Cartão CRIA" para um **construtor genérico de pesquisas** (criar pesquisa, montar formulário com tipos de pergunta, publicar/encerrar/arquivar, coletar respostas, filtrar, exportar), conforme o checklist de aceite da PO. O **Cartão CRIA** passa a ser **uma pesquisa** dentro da plataforma, com seu dashboard especializado preservado.

---

## 1. Objetivo

Plataforma web para **criar, aplicar e analisar pesquisas**. Um gestor/PO monta pesquisas (perguntas de vários tipos, em seções), publica, coletadores registram respostas, e o sistema consolida resultados com filtros, relatórios e exportação. O **Cartão CRIA** é a pesquisa-carro-chefe, com dashboard próprio (mapa de Alagoas, KPIs, indicadores) alimentado pelas respostas + dados administrativos (`MunicipioMensal`).

### Em escopo
1. Autenticação com 4 papéis: **ADMIN, GESTOR (PO), COLETADOR, VISUALIZADOR**.
2. **CRUD de pesquisas** + ciclo de vida (rascunho → publicada → encerrada/arquivada).
3. **Construtor de formulário**: seções/blocos, perguntas de tipos (texto, número, data, múltipla escolha, escolha única, campo aberto), obrigatória/opcional, reordenar/excluir antes de publicar; não publica sem perguntas.
4. **Coleta de respostas** com validação (obrigatórios, número, data, múltipla escolha), mensagens claras, registro de data/hora/responsável.
5. **Consulta**: listar respostas, total, filtros (data, município, unidade, etc.), ver resposta individual.
6. **Relatórios e exportação**: resumo, totais/percentuais corretos, filtros de painel, **export Excel (.xlsx) e CSV**, colunas claras.
7. **Segurança/LGPD**: coleta mínima, dados sensíveis protegidos por papel, finalidade clara, auditoria de quem criou/editou/publicou/encerrou.
8. **Trilha de auditoria + versionamento + soft-delete** (nada é apagado de forma irreversível; usuário desligado = `ativo=false`).
9. **Dashboard Cartão CRIA** preservado (mapa/KPIs/indicadores) como visão especializada.
10. Tema claro/escuro.

### Fora de escopo (agora)
- Lógica condicional entre perguntas (skip logic), pesquisa anônima pública sem login, integração automática com Google Forms/Sheets, app mobile nativo (o front é responsivo), CI/CD e deploy.

---

## 2. Stack técnica

**Frontend:** React 18 + TS + Vite; Tailwind + styled-components; axios + TanStack Query; React Router; react-hook-form + zod; react-chartjs-2. Tema claro/escuro. Responsivo (desktop + celular).

**Backend:** Node + TS + Express; Prisma + PostgreSQL; zod (validação); JWT + bcrypt; helmet, cors, pino; **exceljs** (export .xlsx) + geração de CSV.

**Testes:** Vitest + Supertest (back); Vitest + RTL (front). TDD.

**Infra dev:** docker-compose (Postgres). `.env.example` em cada pasta.

---

## 3. Estrutura de pastas

Mantida da v1:

```text
backend/src/{config,controllers,helper,middleware,models,routes} + app.ts + server.ts
frontend/public/ + frontend/src/{App,Components,Styles} + index.css + main.tsx
```

Módulos de backend (controllers/models/routes) por recurso: `auth`, `usuarios`, `pesquisas`, `perguntas`, `respostas`, `relatorios` (resumo/export), `dashboard` (CRIA), `logs`. `helper/` guarda utilitários puros: validators zod, auditoria, export (csv/xlsx), regionais, período, agregação. `models/` são repositórios Prisma (controllers não chamam Prisma direto).

---

## 4. Modelo de dados (Prisma / PostgreSQL)

> Enums em MAIÚSCULO; colunas camelCase.

### 4.1 `Usuario`
id (uuid), nome, email (unique), senhaHash, **papel** enum `PapelUsuario = ADMIN | GESTOR | COLETADOR | VISUALIZADOR`, ativo (bool, default true), createdAt/updatedAt. Desligamento = `ativo=false`.

### 4.2 `Pesquisa`
id (uuid), titulo, descricao?, responsavelId (FK Usuario — o gestor/PO), **status** enum `StatusPesquisa = RASCUNHO | PUBLICADA | ENCERRADA | ARQUIVADA` (default RASCUNHO), periodoInicio? (date), periodoFim? (date), publicadaEm?, encerradaEm?, versaoAtual (int, default 1), createdById, updatedById?, deletedAt?, deletedById?, createdAt/updatedAt. Índices: status, responsavelId, deletedAt.

### 4.3 `Secao` (bloco)
id (uuid), pesquisaId (FK, cascade), titulo, descricao?, ordem (int). Índice (pesquisaId, ordem).

### 4.4 `Pergunta`
id (uuid), pesquisaId (FK, cascade), secaoId? (FK Secao), enunciado, **tipo** enum `TipoPergunta = TEXTO | NUMERO | DATA | MULTIPLA_ESCOLHA | ESCOLHA_UNICA | CAMPO_ABERTO`, obrigatoria (bool, default false), ordem (int), ajuda? (texto de apoio). Índice (pesquisaId, ordem).

### 4.5 `OpcaoPergunta` (para MULTIPLA_ESCOLHA / ESCOLHA_UNICA)
id (uuid), perguntaId (FK, cascade), texto, ordem (int). Índice (perguntaId, ordem).

### 4.6 `Resposta` (uma submissão de formulário)
id (uuid), pesquisaId (FK), coletadorId (FK Usuario — quem coletou), municipio?, unidade?, regional?, enviadaEm (timestamptz, default now), ip?, deletedAt?, deletedById?, createdAt/updatedAt. Índices: (pesquisaId), municipio, enviadaEm, deletedAt.

### 4.7 `ItemResposta` (resposta a uma pergunta)
id (uuid), respostaId (FK, cascade), perguntaId (FK), valorTexto?, valorNumero? (float), valorData? (date), opcoesSelecionadas (string[] — ids/textos de OpcaoPergunta p/ escolha). Um item por pergunta respondida. Índice (respostaId), (perguntaId).

### 4.8 `MunicipioMensal` e `BeneficioComposicao` (administrativos — dashboard CRIA)
Mantidos da v1 (dados do programa por município/mês; alimentam KPIs, mapa, investimento, benefícios).

### 4.9 `LogAlteracao` (auditoria, append-only)
id, entidade (`Pesquisa`|`Pergunta`|`Resposta`|`Usuario`|…), entidadeId, acao enum `AcaoLog = CREATE | UPDATE | DELETE | RESTORE | PUBLICAR | ENCERRAR | ARQUIVAR`, usuarioId, dadosAntes? (jsonb), dadosDepois? (jsonb), ip?, createdAt. Índices (entidade, entidadeId), usuarioId, createdAt.

### 4.10 `PesquisaVersao` (histórico/restauração)
id, pesquisaId (FK), versao (int), snapshot (jsonb — pesquisa + seções + perguntas + opções), usuarioId, createdAt. Único (pesquisaId, versao).

**Proteção de dados:** excluir pesquisa/resposta = soft-delete (restaurável por ADMIN); toda escrita gera `LogAlteracao`; cada edição de pesquisa gera `PesquisaVersao`.

---

## 5. Resultados, agregação e dashboard

- **Resumo da pesquisa:** total de respostas; por pergunta, distribuição/estatística conforme o tipo (contagem % para escolha; média/mín/máx para número; contagem de preenchidos para texto/data).
- **Filtros:** por período (`enviadaEm`), município, unidade, regional.
- **Resposta individual:** todas as `ItemResposta` de uma `Resposta`.
- **Export:** monta uma planilha (uma linha por resposta; uma coluna por pergunta, nomes claros) em **.xlsx (exceljs)** e **.csv**. Os dados exportados conferem com os exibidos.
- **Dashboard Cartão CRIA:** KPIs/mapa/investimento a partir de `MunicipioMensal`; gráficos analíticos a partir das respostas da(s) pesquisa(s) CRIA (raça, zona, escolaridade, saúde antes/depois, alimentação, NPS, etc.). Índices derivados (MCC/MCG/MCB, TRIA, NPS) calculados das respostas.

---

## 6. API REST (`/api`)

Erros `{ error: { code, message, details? } }`. Validação zod. Toda escrita passa pela auditoria.

**Auth:** `POST /auth/login`, `GET /auth/me`.

**Usuários (ADMIN):** `GET/POST/PUT /usuarios`, `DELETE /usuarios/:id` (desativa), `GET /logs`.

**Pesquisas (GESTOR/ADMIN p/ escrita; todos autenticados p/ leitura conforme papel):**
- `GET /pesquisas` (filtros status/responsável/q, paginado) · `GET /pesquisas/:id` (com seções/perguntas/opções)
- `POST /pesquisas` · `PUT /pesquisas/:id` (só RASCUNHO p/ mudanças estruturais) · `DELETE /pesquisas/:id` (soft)
- `POST /pesquisas/:id/publicar` (valida ≥1 pergunta; RASCUNHO→PUBLICADA) · `POST /pesquisas/:id/encerrar` · `POST /pesquisas/:id/arquivar` · `POST /pesquisas/:id/restaurar` (ADMIN)
- `GET /pesquisas/:id/versoes` (ADMIN/GESTOR)

**Seções/Perguntas/Opções (GESTOR/ADMIN; bloqueadas após publicação):**
- `POST /pesquisas/:id/secoes` · `PUT /secoes/:id` · `DELETE /secoes/:id`
- `POST /pesquisas/:id/perguntas` · `PUT /perguntas/:id` · `DELETE /perguntas/:id` · `POST /pesquisas/:id/perguntas/reordenar` (lista de ids na nova ordem)
- Opções embutidas no payload da pergunta (create/update).

**Respostas (COLETADOR/GESTOR/ADMIN):**
- `GET /pesquisas/:id/respostas` (filtros data/município/unidade, paginado) · `GET /respostas/:id` (individual)
- `POST /pesquisas/:id/respostas` (submissão; valida obrigatórios/tipos; só em pesquisa PUBLICADA) · `DELETE /respostas/:id` (soft)

**Relatórios/Export:**
- `GET /pesquisas/:id/resumo` (totais/percentuais por pergunta, com filtros)
- `GET /pesquisas/:id/export?formato=xlsx|csv` (respeita filtros; download)

**Dashboard CRIA:** `GET /dashboard/filters|resumo|municipios|charts` (a partir de MunicipioMensal + respostas da pesquisa CRIA).

**Papéis:**
- **VISUALIZADOR:** só GET de resultados/resumo/dashboard (sem dados individuais sensíveis).
- **COLETADOR:** + listar pesquisas publicadas e submeter/ver respostas.
- **GESTOR (PO):** + CRUD de pesquisas/perguntas, publicar/encerrar/arquivar, ver/exportar respostas.
- **ADMIN:** tudo + usuários, restaurar, logs.

---

## 7. Frontend — páginas

Layout global (sidebar + topbar com filtros/tema/usuário), rotas protegidas por papel.
- **Login**.
- **Pesquisas** (lista + criar) — status, responsável, período; ações conforme papel.
- **Construtor de pesquisa** (GESTOR) — editar pesquisa em rascunho: seções, perguntas (tipos), obrigatória/opcional, reordenar (drag ou setas), opções; publicar/encerrar/arquivar; bloqueios após publicação.
- **Responder pesquisa** (COLETADOR) — formulário gerado dinamicamente das perguntas, com validação (react-hook-form + zod), mensagens de erro/confirmação; responsivo.
- **Respostas** (GESTOR) — lista com filtros/paginação, ver individual, **exportar Excel/CSV**.
- **Resumo/Relatório** — totais/percentuais por pergunta (gráficos) com filtros.
- **Dashboard Cartão CRIA** — KPIs, mapa de Alagoas, indicadores (visão especializada).
- **Usuários** (ADMIN) · **Logs/Auditoria** (ADMIN).

Componentes: Card, Kpi, Tag/Status, Modal, Toast, DataTable (paginação), Field/Input/Select, Button, ThemeToggle; construtor (QuestionEditor por tipo); renderer de formulário (QuestionField por tipo); charts tematizados; MapaAlagoas.

---

## 8. Tema claro/escuro
Tokens CSS + styled-components ThemeProvider; toggle na topbar; persistência em localStorage; `prefers-color-scheme` no 1º acesso; gráficos/mapa recolorem pelo tema. (Já implementado na fundação.)

---

## 9. Auth, papéis e LGPD
- bcrypt + JWT (~8h); interceptor axios (token/401).
- Middlewares `autenticar` + `exigirPapel`. (Já implementados.)
- **LGPD:** coletar só o necessário; campos sensíveis marcáveis e ocultos para VISUALIZADOR (mascaramento); finalidade da pesquisa exibida ao respondente; CPF/NIS e afins nunca em logs do pino; snapshots de auditoria restritos a ADMIN. Termo de consentimento configurável por pesquisa (campo `descricao`/flag) — validar com a PO.

---

## 10. Seed e dev
- docker-compose (Postgres `criapesquisa`).
- `prisma migrate` + `prisma db seed`:
  1. Usuários padrão: admin/gestor/coletador/visualizador (`@cria.al`, senha em `.env.example`).
  2. `MunicipioMensal` + `BeneficioComposicao` (de `seed_municipios.json`).
  3. Pesquisa(s) **Cartão CRIA — Criança** e **Cartão CRIA — Gestante** seedadas (seções + perguntas conforme os formulários Google), publicadas, com algumas respostas de exemplo — para o dashboard e as telas não nascerem vazios.

---

## 11. Fases de implementação (revisadas)

- **Fase 1 — Fundação (CONCLUÍDA):** scaffold back/front, Prisma+docker, auth (login/me) + papéis, middlewares, tema, layout, roteamento protegido. *(Schema será ajustado na Fase 2.)*
- **Fase 2 — Domínio + CRUD de pesquisas (API funcional):** reformular schema (Pesquisa/Secao/Pergunta/Opcao/Resposta/ItemResposta; papéis; remover modelo fixo antigo); repositórios; CRUD de pesquisas + ciclo de vida + perguntas/seções/opções + reordenar; validação; auditoria/versão. Remover código duplicado. Testes.
- **Fase 3 — Coleta + consulta + export:** submissão de respostas com validação; listagem/filtros; resposta individual; resumo/percentuais; export .xlsx/.csv. Testes.
- **Fase 4 — Frontend do construtor + coleta + relatórios + dashboard CRIA:** telas de pesquisas, construtor, responder, respostas/filtros, resumo, export, usuários, logs; dashboard CRIA (mapa/KPIs/charts); polish claro/escuro + responsividade.

Cada fase vira um plano próprio (writing-plans) com tarefas testáveis.

---

## 12. Mapeamento do checklist de aceite (PO) → sistema

| Seção do checklist | Onde é atendido |
|---|---|
| 1. Escopo da funcionalidade | Este spec + validação da PO |
| 2. Cadastro e gestão da pesquisa | §4.2 `Pesquisa` (título/descrição/responsável/período/status) + §6 CRUD + publicar/encerrar/arquivar + bloqueio pós-publicação |
| 3. Construção do formulário | §4.3–4.5 Seção/Pergunta/Opção + tipos + obrigatória/opcional + reordenar/excluir + "não publica sem perguntas" (regra em `/publicar`) |
| 4. Regras de preenchimento | §6 `POST respostas` valida obrigatórios/número/data/escolha; mensagens claras (front); registro data/hora/responsável (`enviadaEm`, `coletadorId`) |
| 5. Acesso e permissões | §9 papéis ADMIN/GESTOR(PO)/COLETADOR/VISUALIZADOR + middleware; auditoria de quem criou/editou/publicou/encerrou (§4.9) |
| 6. Coleta de dados | Front responsivo (desktop/mobile), submit + confirmação; simulação pela PO na homologação |
| 7. Consulta, filtros e acompanhamento | §5/§6 listar respostas, total, filtros (data/município/unidade), individual; dados da tela = enviados |
| 8. Relatórios e exportação | §5 resumo/percentuais + export .xlsx/.csv com colunas claras; exportado = exibido |
| 9. Segurança e LGPD | §9 coleta mínima, dados sensíveis protegidos, finalidade/consentimento, base estruturada |
| 10. Homologação e aceite | Testes + homologação pela PO |
| Critérios de reprovação | Viram os **critérios de sucesso** (§13), testados |

---

## 13. Critérios de sucesso (inverso dos critérios de reprovação da PO)

- Nenhuma resposta enviada é perdida (persistência transacional; soft-delete).
- O formulário funciona no celular (responsivo) e em navegadores comuns.
- Campos obrigatórios **não** podem ser enviados em branco (validação back + front).
- Usuários sem permissão **não** acessam dados sensíveis nem editam/excluem.
- Filtros retornam resultados corretos.
- Dados exportados **conferem** com os registrados/exibidos.
- A PO consegue testar o fluxo completo: criar → publicar → responder → consultar → exportar.
- Toda alteração fica auditada (quem/quando/antes-depois); exclusão é reversível.

---

## 14. Premissas e questões em aberto
1. Campos das pesquisas Cartão CRIA seedadas: derivar dos formulários Google/ficha técnica (1ª seção obtida; restante do modal do HTML) — validar com a PO.
2. Termo de consentimento LGPD: por pesquisa (texto exibido ao respondente) — confirmar formato com a PO.
3. "Unidade" nas respostas (filtro seção 7): confirmar o que é (CRAS/UBS/escola?) para o Cartão CRIA.
4. Export: `.xlsx` via exceljs + `.csv`; confirmar se há layout/colunas específicas exigidas.
5. Pesquisa pública/anônima (respondente sem login): fora de escopo agora; hoje coleta é feita por COLETADOR logado. Confirmar se haverá link público depois.
6. Deploy/produção: fase futura.
