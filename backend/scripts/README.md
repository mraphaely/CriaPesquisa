# Scripts utilitários (backend)

Rodar da pasta `backend/` com **tsx**: `npx tsx scripts/<arquivo>.ts`.
Todos usam o Prisma client (`src/config/prisma.js`) — o Postgres precisa estar no ar
(`node scripts/pg-local.mjs`).

| Script | O que faz | Muda o banco? |
|---|---|---|
| `pg-local.mjs` | Sobe o PostgreSQL embutido (porta 5433). Mantém em foreground. | — (infra) |
| `contar.ts` | Conta os registros de cada tabela. | Não (leitura) |
| `inspecionar-db.ts` | Lista as pesquisas ativas com seções, perguntas e opções. | Não (leitura) |
| `gerar-dicionario.ts` | Gera `docs/pesquisas-cartao-cria.md` a partir do banco. | Não (só escreve o `.md`) |
| `pesquisa-crianca-completa.ts` | (Re)cria a pesquisa **Cartão CRIA — Criança** (64 perguntas). Idempotente. | Sim |
| `pesquisa-gestante-completa.ts` | (Re)cria a pesquisa **Cartão CRIA — Gestante** (62 perguntas). Idempotente. | Sim |
| `migrar-credenciais.ts` | Padroniza e-mail (definido em `SEED_EMAIL_DOMINIO`) e senha das contas-base. Idempotente. | Sim |
| `aprovar-existentes.ts` | Aprova respostas que ficaram `PENDENTE`. | Sim |

## Fonte da verdade das pesquisas

As definições das duas pesquisas do Cartão CRIA ficam em
**`prisma/pesquisas-cartao-cria.ts`** (seções, perguntas, tipos, opções, obrigatoriedade).
Tanto o `seed` quanto os scripts `pesquisa-*-completa.ts` consomem esse módulo — então
há um único lugar para editar. Depois de alterar, rode o builder correspondente e o
`gerar-dicionario.ts` para atualizar o doc.

## Recriar do zero

`npx prisma db push` → `npm run seed` recria usuários + as duas pesquisas reais
(sem respostas) + os dados de painel (municípios/benefícios).
