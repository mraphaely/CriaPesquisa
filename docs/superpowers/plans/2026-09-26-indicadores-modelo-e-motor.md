# Indicadores do Cartão CRIA — modelo, cadastro e motor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastrar indicadores ligados às perguntas reais e calcular o valor de cada um a partir das respostas aprovadas, pela API.

**Architecture:** Três camadas separadas por pureza. O catálogo de tipos vira Zod por tipo (`indicadorConfig.ts`); o motor é função pura sobre respostas já carregadas (`helper/motor/`), no mesmo estilo de `helper/resumo.ts`; só o modelo e o controller tocam Prisma. O motor calcula por indivíduo e só então agrega, porque as classificações por faixa exigem o valor existir pessoa a pessoa.

**Tech Stack:** Node, Express, TypeScript (ESM, imports com `.js`), Prisma, PostgreSQL, Zod, Vitest, Supertest.

**Spec:** `docs/superpowers/specs/2026-09-24-indicadores-design.md`

**Escopo deste plano:** fases 1 e 2 da spec — modelo, cadastro e motor. Importação da planilha (fase 3) e painel (fase 4) têm planos próprios. Ao fim deste plano é possível cadastrar um indicador e obter o número pela API, sem tela.

## Global Constraints

- ESM: todo import relativo termina em `.js`, inclusive para arquivos `.ts`.
- Erros de domínio via `HttpError(status, code, message)` de `src/middleware/errorHandler.js`. Nunca `res.status().json()` para erro.
- Toda escrita passa por `registrarLog` de `src/helper/auditoria.js`, com `entidade: "Indicador"`.
- Exclusão é lógica: `deletedAt` + `deletedById`. Nenhuma consulta de leitura retorna registro com `deletedAt` preenchido.
- Cadastro e edição de indicador: apenas `ADMIN` e `GESTOR`, via `exigirPapel("ADMIN", "GESTOR")`. Leitura: qualquer papel autenticado.
- O motor (`src/helper/motor/**`) não importa Prisma nem Express. Recebe dados em memória e devolve dados.
- Só respostas com `status: "APROVADA"` e `deletedAt: null` entram em cálculo.
- Pergunta em branco sai do numerador **e** do denominador. Branco é `null`/`undefined`/string vazia/array vazio — **zero não é branco**.
- Nenhum indicador com `status: "DEFINICAO_INCOMPLETA"` produz número; quem depende dele também não.
- Testes e nomes de domínio em português, como o resto do repositório.
- Banco de desenvolvimento: `npm run db` (porta 5433) precisa estar no ar para as tarefas 1 e 9.

## Review Focus

Classes de entrada que a spec implica, que nenhuma tarefa exercitaria por conta própria, e onde cada teste foi encaixado:

1. **Altura zero ou ausente no IMC** — divisão por zero produz `Infinity`/`NaN`, que viram `null` no JSON e aparecem como buraco no painel sem explicação. Deve virar "sem dados" para aquele indivíduo. → Tarefa 5.
2. **Faixas de classificação com fronteira ambígua** — `0–25` e `25–50`: o valor exatamente 25 cai em duas faixas, e a soma dos percentuais passa de 100. Regra: `de <= v < ate`, com a última faixa inclusiva à direita. → Tarefa 6.
3. **Resposta com dois itens para a mesma pergunta** — dado sujo vindo de importação ou de edição concorrente; um `Map` silenciosamente fica com o último e ninguém percebe. Deve ser recusado ao montar a resposta avaliável. → Tarefa 5.
4. **Indicador apontando para pergunta que não existe mais** — pergunta removida da pesquisa depois do cadastro. Não pode explodir no cálculo; vira `DEFINICAO_INCOMPLETA` com motivo. → Tarefa 7.
5. **Zero confundido com branco** — renda 0 e "não respondeu" são coisas diferentes; tratar 0 como branco muda o denominador e o número final. → Tarefa 5.

---

### Task 1: Modelo de dados

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_indicadores/migration.sql` (gerada)
- Test: `backend/tests/indicadorSchema.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: modelos Prisma `Indicador` e `IndicadorDependencia`; enums `TipoIndicador`, `StatusIndicador`, `RecorteIndicador`.

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/indicadorSchema.test.ts`:

```ts
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/config/prisma.js";

describe("modelo Indicador", () => {
  afterAll(async () => {
    await prisma.indicador.deleteMany({ where: { codigo: { startsWith: "TESTE_" } } });
    await prisma.$disconnect();
  });

  it("grava e lê um indicador com config em jsonb", async () => {
    const criado = await prisma.indicador.create({
      data: {
        codigo: "TESTE_ZONA_RURAL",
        nome: "% Famílias em zona rural",
        tipo: "PROPORCAO",
        status: "DEFINICAO_INCOMPLETA",
        config: { perguntaId: "p1", opcoesNumerador: ["Rural"] },
      },
    });

    const lido = await prisma.indicador.findUniqueOrThrow({ where: { id: criado.id } });
    expect(lido.config).toEqual({ perguntaId: "p1", opcoesNumerador: ["Rural"] });
    expect(lido.status).toBe("DEFINICAO_INCOMPLETA");
    expect(lido.meta).toBeNull();
  });

  it("recusa dois indicadores com o mesmo código", async () => {
    await prisma.indicador.create({ data: { codigo: "TESTE_DUP", nome: "A", tipo: "CONTAGEM", config: {} } });
    await expect(
      prisma.indicador.create({ data: { codigo: "TESTE_DUP", nome: "B", tipo: "CONTAGEM", config: {} } }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/indicadorSchema.test.ts`
Expected: FAIL — `prisma.indicador` é `undefined` (o modelo não existe).

- [ ] **Step 3: Write minimal implementation**

Em `backend/prisma/schema.prisma`, junto dos outros enums:

```prisma
enum TipoIndicador {
  PROPORCAO
  CRUZAMENTO
  MEDIA
  DERIVADA
  COMPOSTO
  CLASSIFICACAO
  CONTAGEM
  DISTRIBUICAO
}

enum StatusIndicador {
  ATIVO
  DEFINICAO_INCOMPLETA
  INATIVO
}

enum RecorteIndicador {
  ANTES_APOS
}
```

E ao fim do arquivo:

```prisma
model Indicador {
  id             String            @id @default(uuid())
  codigo         String            @unique
  nome           String
  objetivo       String?
  tipo           TipoIndicador
  unidade        String?
  casasDecimais  Int               @default(1)
  pesquisaId     String?
  config         Json
  recorte        RecorteIndicador?
  recorteConfig  Json?
  meta           Float?
  formulaOriginal String?
  status         StatusIndicador   @default(DEFINICAO_INCOMPLETA)
  motivoIncompleto String?
  origemPlanilha Int?
  createdById    String?
  updatedById    String?
  deletedAt      DateTime?
  deletedById    String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  pesquisa     Pesquisa?              @relation(fields: [pesquisaId], references: [id])
  dependeDe    IndicadorDependencia[] @relation("IndicadorOrigem")
  usadoPor     IndicadorDependencia[] @relation("IndicadorDestino")

  @@index([status])
  @@index([pesquisaId])
  @@index([deletedAt])
}

model IndicadorDependencia {
  indicadorId String
  dependeDeId String

  indicador Indicador @relation("IndicadorOrigem", fields: [indicadorId], references: [id], onDelete: Cascade)
  dependeDe Indicador @relation("IndicadorDestino", fields: [dependeDeId], references: [id])

  @@id([indicadorId, dependeDeId])
  @@index([dependeDeId])
}
```

Acrescente ao model `Pesquisa`, junto das outras relações:

```prisma
  indicadores Indicador[]
```

- [ ] **Step 4: Gerar a migration e o client**

Run: `cd backend && npm run prisma:migrate -- --name indicadores && npm run prisma:generate`
Expected: uma pasta nova em `prisma/migrations/` e "Your database is now in sync with your schema."

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/indicadorSchema.test.ts`
Expected: PASS, 2 testes.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/tests/indicadorSchema.test.ts
git commit -m "feat: modelo de indicadores e dependencias"
```

---

### Task 2: Catálogo de tipos validado por Zod

**Files:**
- Create: `backend/src/helper/indicadorConfig.ts`
- Test: `backend/tests/indicadorConfig.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces:
  - `export type TipoIndicador = "PROPORCAO" | "CRUZAMENTO" | "MEDIA" | "DERIVADA" | "COMPOSTO" | "CLASSIFICACAO" | "CONTAGEM" | "DISTRIBUICAO"`
  - `export type ConfigIndicador` (união discriminada por `tipo`)
  - `export type NoExpressao`
  - `export function validarConfig(tipo: TipoIndicador, config: unknown): ConfigIndicador` — lança `ZodError`
  - `export function perguntasReferenciadas(config: ConfigIndicador): string[]`
  - `export function indicadoresReferenciados(config: ConfigIndicador): string[]`

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/indicadorConfig.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validarConfig, perguntasReferenciadas, indicadoresReferenciados } from "../src/helper/indicadorConfig.js";

describe("validarConfig", () => {
  it("aceita PROPORCAO com pergunta e opções do numerador", () => {
    const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });
    expect(config).toEqual({ tipo: "PROPORCAO", perguntaId: "p1", opcoesNumerador: ["Rural"] });
  });

  it("recusa PROPORCAO sem nenhuma opção no numerador", () => {
    // Sem numerador o indicador daria 0 para todo mundo, silenciosamente.
    expect(() => validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: [] })).toThrow();
  });

  it("recusa config de um tipo aplicada a outro", () => {
    expect(() => validarConfig("MEDIA", { perguntaId: "p1", opcoesNumerador: ["x"] })).toThrow();
  });

  it("aceita COMPOSTO com termos ponderados e divisor", () => {
    const config = validarConfig("COMPOSTO", {
      termos: [{ indicadorId: "i1", peso: 3 }, { indicadorId: "i2", peso: 5 }],
      divisor: 8,
    });
    expect(indicadoresReferenciados(config)).toEqual(["i1", "i2"]);
  });

  it("recusa COMPOSTO com divisor zero", () => {
    expect(() => validarConfig("COMPOSTO", { termos: [{ indicadorId: "i1", peso: 1 }], divisor: 0 })).toThrow();
  });

  it("aceita DERIVADA como árvore de expressão, sem texto para avaliar", () => {
    const config = validarConfig("DERIVADA", {
      variaveis: { peso: "p10", altura: "p11" },
      expressao: { op: "/", esq: { var: "peso" }, dir: { op: "*", esq: { var: "altura" }, dir: { var: "altura" } } },
    });
    expect(perguntasReferenciadas(config).sort()).toEqual(["p10", "p11"]);
  });

  it("recusa DERIVADA que usa variável não declarada", () => {
    expect(() =>
      validarConfig("DERIVADA", { variaveis: { peso: "p10" }, expressao: { var: "altura" } }),
    ).toThrow();
  });

  it("aceita CLASSIFICACAO com faixas e devolve o indicador de origem", () => {
    const config = validarConfig("CLASSIFICACAO", {
      indicadorId: "mcc",
      faixas: [
        { rotulo: "Crítico", de: 0, ate: 25 },
        { rotulo: "Baixo", de: 25, ate: 50 },
      ],
    });
    expect(indicadoresReferenciados(config)).toEqual(["mcc"]);
  });

  it("recusa CLASSIFICACAO com faixa invertida", () => {
    expect(() =>
      validarConfig("CLASSIFICACAO", { indicadorId: "mcc", faixas: [{ rotulo: "X", de: 50, ate: 10 }] }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/indicadorConfig.test.ts`
Expected: FAIL — `Cannot find module '../src/helper/indicadorConfig.js'`.

- [ ] **Step 3: Write minimal implementation**

Crie `backend/src/helper/indicadorConfig.ts`:

```ts
import { z } from "zod";

/**
 * Catálogo fechado de tipos. Cada tipo tem sua forma de config, validada aqui.
 *
 * A expressão da DERIVADA é uma árvore, não texto: avaliar string exigiria
 * `eval` ou um parser, e nenhum dos dois é aceitável para um campo que vem do
 * banco e é editável pela tela.
 */

const id = z.string().min(1);

const noExpressao: z.ZodType<NoExpressao> = z.lazy(() =>
  z.union([
    z.object({ var: z.string().min(1) }),
    z.object({ const: z.number() }),
    z.object({ op: z.enum(["+", "-", "*", "/"]), esq: noExpressao, dir: noExpressao }),
  ]),
);

export type NoExpressao =
  | { var: string }
  | { const: number }
  | { op: "+" | "-" | "*" | "/"; esq: NoExpressao; dir: NoExpressao };

const proporcao = z.object({
  tipo: z.literal("PROPORCAO"),
  perguntaId: id,
  opcoesNumerador: z.array(z.string().min(1)).min(1),
});

const condicao = z.object({
  perguntaId: id,
  opcoes: z.array(z.string().min(1)).min(1).optional(),
  operador: z.enum(["<", "<=", ">", ">=", "=="]).optional(),
  valor: z.number().optional(),
});

const cruzamento = z.object({
  tipo: z.literal("CRUZAMENTO"),
  condicoes: z.array(condicao).min(2),
});

const media = z.object({ tipo: z.literal("MEDIA"), perguntaId: id });

const derivada = z
  .object({
    tipo: z.literal("DERIVADA"),
    variaveis: z.record(z.string().min(1), id),
    expressao: noExpressao,
  })
  .refine(
    (c) => variaveisUsadas(c.expressao).every((v) => v in c.variaveis),
    { message: "expressão usa variável não declarada" },
  );

const composto = z.object({
  tipo: z.literal("COMPOSTO"),
  termos: z.array(z.object({ indicadorId: id, peso: z.number() })).min(1),
  divisor: z.number().refine((d) => d !== 0, { message: "divisor não pode ser zero" }),
});

const classificacao = z.object({
  tipo: z.literal("CLASSIFICACAO"),
  indicadorId: id,
  faixas: z
    .array(z.object({ rotulo: z.string().min(1), de: z.number(), ate: z.number() }))
    .min(1)
    .refine((fs) => fs.every((f) => f.de < f.ate), { message: "faixa com início maior que o fim" }),
});

const contagem = z.object({ tipo: z.literal("CONTAGEM") });
const distribuicao = z.object({ tipo: z.literal("DISTRIBUICAO"), perguntaId: id });

const esquemas = {
  PROPORCAO: proporcao,
  CRUZAMENTO: cruzamento,
  MEDIA: media,
  DERIVADA: derivada,
  COMPOSTO: composto,
  CLASSIFICACAO: classificacao,
  CONTAGEM: contagem,
  DISTRIBUICAO: distribuicao,
} as const;

export type TipoIndicador = keyof typeof esquemas;
export type ConfigIndicador = z.infer<(typeof esquemas)[TipoIndicador]>;

function variaveisUsadas(no: NoExpressao): string[] {
  if ("var" in no) return [no.var];
  if ("const" in no) return [];
  return [...variaveisUsadas(no.esq), ...variaveisUsadas(no.dir)];
}

export function validarConfig(tipo: TipoIndicador, config: unknown): ConfigIndicador {
  const bruto = typeof config === "object" && config !== null ? config : {};
  return esquemas[tipo].parse({ ...bruto, tipo }) as ConfigIndicador;
}

export function perguntasReferenciadas(config: ConfigIndicador): string[] {
  switch (config.tipo) {
    case "PROPORCAO":
    case "MEDIA":
    case "DISTRIBUICAO":
      return [config.perguntaId];
    case "CRUZAMENTO":
      return config.condicoes.map((c) => c.perguntaId);
    case "DERIVADA":
      return Object.values(config.variaveis);
    default:
      return [];
  }
}

export function indicadoresReferenciados(config: ConfigIndicador): string[] {
  if (config.tipo === "COMPOSTO") return config.termos.map((t) => t.indicadorId);
  if (config.tipo === "CLASSIFICACAO") return [config.indicadorId];
  return [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/indicadorConfig.test.ts`
Expected: PASS, 9 testes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/helper/indicadorConfig.ts backend/tests/indicadorConfig.test.ts
git commit -m "feat: catalogo de tipos de indicador validado por zod"
```

---

### Task 3: Ordem de dependência e detecção de ciclo

**Files:**
- Create: `backend/src/helper/dependencias.ts`
- Test: `backend/tests/dependencias.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces:
  - `export class CicloDetectado extends Error { constructor(public readonly ciclo: string[]) }`
  - `export function ordenarPorDependencia(grafo: Map<string, string[]>): string[]` — devolve dependências antes de quem depende; lança `CicloDetectado`.

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/dependencias.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ordenarPorDependencia, CicloDetectado } from "../src/helper/dependencias.js";

describe("ordenarPorDependencia", () => {
  it("coloca a dependência antes de quem depende dela", () => {
    // idtc depende de mcc; mcc depende de vcras
    const ordem = ordenarPorDependencia(
      new Map([
        ["idtc", ["mcc"]],
        ["mcc", ["vcras"]],
        ["vcras", []],
      ]),
    );
    expect(ordem.indexOf("vcras")).toBeLessThan(ordem.indexOf("mcc"));
    expect(ordem.indexOf("mcc")).toBeLessThan(ordem.indexOf("idtc"));
  });

  it("aceita grafo sem nenhuma dependência", () => {
    const ordem = ordenarPorDependencia(new Map([["a", []], ["b", []]]));
    expect(ordem.sort()).toEqual(["a", "b"]);
  });

  it("detecta ciclo e diz quem está nele", () => {
    try {
      ordenarPorDependencia(new Map([["a", ["b"]], ["b", ["a"]]]));
      expect.unreachable("deveria ter lançado CicloDetectado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(CicloDetectado);
      expect((erro as CicloDetectado).ciclo).toContain("a");
      expect((erro as CicloDetectado).ciclo).toContain("b");
    }
  });

  it("detecta o ciclo de um nó consigo mesmo", () => {
    expect(() => ordenarPorDependencia(new Map([["a", ["a"]]]))).toThrow(CicloDetectado);
  });

  it("ignora dependência para fora do grafo sem quebrar", () => {
    // Acontece quando se calcula um subconjunto dos indicadores.
    const ordem = ordenarPorDependencia(new Map([["a", ["fora"]]]));
    expect(ordem).toEqual(["a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/dependencias.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Write minimal implementation**

Crie `backend/src/helper/dependencias.ts`:

```ts
/**
 * Ordenação topológica dos indicadores.
 *
 * O MCC precisa existir antes do IDTC, e o IDTC antes das classificações. Sem
 * ordem, o cálculo leria um valor ainda não produzido e devolveria número
 * plausível e errado — o pior resultado possível num painel de política pública.
 */

export class CicloDetectado extends Error {
  constructor(public readonly ciclo: string[]) {
    super(`dependência circular entre indicadores: ${ciclo.join(" → ")}`);
    this.name = "CicloDetectado";
  }
}

const NAO_VISITADO = 0;
const EM_VISITA = 1;
const PRONTO = 2;

export function ordenarPorDependencia(grafo: Map<string, string[]>): string[] {
  const estado = new Map<string, number>();
  const ordem: string[] = [];
  const caminho: string[] = [];

  function visitar(no: string): void {
    if (!grafo.has(no)) return; // dependência fora do subconjunto pedido
    const atual = estado.get(no) ?? NAO_VISITADO;
    if (atual === PRONTO) return;
    if (atual === EM_VISITA) {
      const inicio = caminho.indexOf(no);
      throw new CicloDetectado([...caminho.slice(inicio), no]);
    }

    estado.set(no, EM_VISITA);
    caminho.push(no);
    for (const dependencia of grafo.get(no) ?? []) visitar(dependencia);
    caminho.pop();
    estado.set(no, PRONTO);
    ordem.push(no);
  }

  for (const no of grafo.keys()) visitar(no);
  return ordem;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/dependencias.test.ts`
Expected: PASS, 5 testes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/helper/dependencias.ts backend/tests/dependencias.test.ts
git commit -m "feat: ordem topologica e deteccao de ciclo entre indicadores"
```

---

### Task 4: Cadastro de indicadores (modelo, controller, rotas)

**Files:**
- Create: `backend/src/models/indicadorModel.ts`
- Create: `backend/src/controllers/indicadorController.ts`
- Create: `backend/src/routes/indicadorRoutes.ts`
- Modify: `backend/src/routes/index.ts`
- Modify: `backend/src/helper/validators.ts`
- Test: `backend/tests/indicadores.test.ts`

**Interfaces:**
- Consumes: `validarConfig`, `indicadoresReferenciados` (Tarefa 2); `ordenarPorDependencia`, `CicloDetectado` (Tarefa 3).
- Produces:
  - `indicadorModel.listar(filtros)`, `.obterPorId(id)`, `.criar(dados, usuarioId)`, `.atualizar(id, dados, usuarioId)`, `.softDelete(id, usuarioId)`, `.grafoDeDependencias()`
  - `criarIndicadorSchema`, `atualizarIndicadorSchema` em `validators.ts`
  - rotas `GET/POST /api/indicadores`, `GET/PUT/DELETE /api/indicadores/:id`

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/indicadores.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/indicadorModel.js");
vi.mock("../src/helper/auditoria.js");

import { createApp } from "../src/app.js";
import { indicadorModel } from "../src/models/indicadorModel.js";
import { registrarLog } from "../src/helper/auditoria.js";
import { gerarToken } from "../src/helper/token.js";

const app = createApp();
const tokenGestor = gerarToken({ sub: "u1", papel: "GESTOR" });
const tokenAdmin = gerarToken({ sub: "u2", papel: "ADMIN" });
const tokenColetador = gerarToken({ sub: "u3", papel: "COLETADOR" });

const CORPO_VALIDO = {
  codigo: "ZONA_RURAL",
  nome: "% Famílias em zona rural",
  tipo: "PROPORCAO",
  config: { perguntaId: "p1", opcoesNumerador: ["Rural"] },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(indicadorModel.grafoDeDependencias).mockResolvedValue(new Map());
});

describe("POST /api/indicadores", () => {
  it("GESTOR cria indicador válido -> 201 e registra auditoria", async () => {
    vi.mocked(indicadorModel.criar).mockResolvedValue({ id: "i1", ...CORPO_VALIDO } as never);

    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send(CORPO_VALIDO);

    expect(res.status).toBe(201);
    expect(registrarLog).toHaveBeenCalledOnce();
  });

  it("ADMIN também pode criar -> 201", async () => {
    vi.mocked(indicadorModel.criar).mockResolvedValue({ id: "i1", ...CORPO_VALIDO } as never);
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(CORPO_VALIDO);
    expect(res.status).toBe(201);
  });

  it("COLETADOR não pode criar -> 403", async () => {
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenColetador}`)
      .send(CORPO_VALIDO);
    expect(res.status).toBe(403);
    expect(indicadorModel.criar).not.toHaveBeenCalled();
  });

  it("sem token -> 401", async () => {
    const res = await request(app).post("/api/indicadores").send(CORPO_VALIDO);
    expect(res.status).toBe(401);
  });

  it("config que não bate com o tipo -> 422", async () => {
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ ...CORPO_VALIDO, tipo: "MEDIA" });

    expect(res.status).toBe(422);
    expect(indicadorModel.criar).not.toHaveBeenCalled();
  });

});

describe("PUT /api/indicadores/:id", () => {
  it("recusa dependência circular -> 409 com o ciclo no corpo", async () => {
    // O IDTC já depende do MCC. Editar o MCC para depender do IDTC fecha o ciclo.
    vi.mocked(indicadorModel.obterPorId).mockResolvedValue({ id: "mcc", tipo: "COMPOSTO", config: {} } as never);
    vi.mocked(indicadorModel.grafoDeDependencias).mockResolvedValue(new Map([["idtc", ["mcc"]]]));

    const res = await request(app)
      .put("/api/indicadores/mcc")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ tipo: "COMPOSTO", config: { termos: [{ indicadorId: "idtc", peso: 1 }], divisor: 1 } });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DEPENDENCIA_CIRCULAR");
    expect(indicadorModel.atualizar).not.toHaveBeenCalled();
  });
});

describe("GET /api/indicadores", () => {
  it("qualquer papel autenticado lista -> 200", async () => {
    vi.mocked(indicadorModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    const res = await request(app).get("/api/indicadores").set("Authorization", `Bearer ${tokenColetador}`);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/indicadores/:id", () => {
  it("recusa apagar indicador do qual outro depende -> 409", async () => {
    vi.mocked(indicadorModel.obterPorId).mockResolvedValue({ id: "mcc", codigo: "MCC" } as never);
    vi.mocked(indicadorModel.grafoDeDependencias).mockResolvedValue(new Map([["idtc", ["mcc"]]]));

    const res = await request(app).delete("/api/indicadores/mcc").set("Authorization", `Bearer ${tokenGestor}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INDICADOR_EM_USO");
    expect(indicadorModel.softDelete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/indicadores.test.ts`
Expected: FAIL — módulo `indicadorModel` não encontrado.

- [ ] **Step 3: Escrever o schema de entrada**

Acrescente ao fim de `backend/src/helper/validators.ts`:

```ts
// ---------- Indicador ----------

export const criarIndicadorSchema = z.object({
  codigo: z.string().min(1).max(60),
  nome: z.string().min(1),
  objetivo: z.string().optional(),
  tipo: z.enum([
    "PROPORCAO", "CRUZAMENTO", "MEDIA", "DERIVADA",
    "COMPOSTO", "CLASSIFICACAO", "CONTAGEM", "DISTRIBUICAO",
  ]),
  unidade: z.string().optional(),
  casasDecimais: z.number().int().min(0).max(4).default(1),
  pesquisaId: z.string().uuid().optional(),
  config: z.unknown(),
  recorte: z.literal("ANTES_APOS").optional(),
  recorteConfig: z
    .object({ substituicoes: z.array(z.object({ de: z.string().min(1), para: z.string().min(1) })).min(1) })
    .optional(),
  meta: z.number().optional(),
  formulaOriginal: z.string().optional(),
  origemPlanilha: z.number().int().optional(),
});
export type CriarIndicadorInput = z.infer<typeof criarIndicadorSchema>;

export const atualizarIndicadorSchema = criarIndicadorSchema.partial();
export type AtualizarIndicadorInput = z.infer<typeof atualizarIndicadorSchema>;
```

- [ ] **Step 4: Escrever o modelo**

Crie `backend/src/models/indicadorModel.ts`:

```ts
import { prisma } from "../config/prisma.js";
import type { Prisma, StatusIndicador } from "@prisma/client";
import type { CriarIndicadorInput, AtualizarIndicadorInput } from "../helper/validators.js";

export interface ListarIndicadoresFiltros {
  status?: StatusIndicador;
  pesquisaId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const indicadorModel = {
  async listar(filtros: ListarIndicadoresFiltros = {}) {
    const { status, pesquisaId, q, page = 1, pageSize = 50 } = filtros;
    const where: Prisma.IndicadorWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (pesquisaId) where.pesquisaId = pesquisaId;
    if (q) where.nome = { contains: q, mode: "insensitive" };

    const [total, itens] = await Promise.all([
      prisma.indicador.count({ where }),
      prisma.indicador.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { codigo: "asc" },
      }),
    ]);
    return { total, itens };
  },

  obterPorId(id: string) {
    return prisma.indicador.findFirst({ where: { id, deletedAt: null } });
  },

  listarAtivos() {
    return prisma.indicador.findMany({ where: { deletedAt: null, status: { not: "INATIVO" } } });
  },

  async criar(dados: CriarIndicadorInput, usuarioId: string, dependencias: string[]) {
    return prisma.indicador.create({
      data: {
        codigo: dados.codigo,
        nome: dados.nome,
        objetivo: dados.objetivo,
        tipo: dados.tipo,
        unidade: dados.unidade,
        casasDecimais: dados.casasDecimais,
        pesquisaId: dados.pesquisaId,
        config: dados.config as Prisma.InputJsonValue,
        recorte: dados.recorte,
        recorteConfig: dados.recorteConfig as Prisma.InputJsonValue | undefined,
        meta: dados.meta,
        formulaOriginal: dados.formulaOriginal,
        origemPlanilha: dados.origemPlanilha,
        createdById: usuarioId,
        dependeDe: { create: dependencias.map((dependeDeId) => ({ dependeDeId })) },
      },
    });
  },

  async atualizar(id: string, dados: AtualizarIndicadorInput, usuarioId: string, dependencias: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.indicadorDependencia.deleteMany({ where: { indicadorId: id } });
      return tx.indicador.update({
        where: { id },
        data: {
          ...dados,
          config: dados.config as Prisma.InputJsonValue,
          recorteConfig: dados.recorteConfig as Prisma.InputJsonValue | undefined,
          updatedById: usuarioId,
          dependeDe: { create: dependencias.map((dependeDeId) => ({ dependeDeId })) },
        },
      });
    });
  },

  softDelete(id: string, usuarioId: string) {
    return prisma.indicador.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: usuarioId },
    });
  },

  /** indicadorId -> ids de quem ele consome. Base da ordem de cálculo e da recusa de ciclo. */
  async grafoDeDependencias(): Promise<Map<string, string[]>> {
    const arestas = await prisma.indicadorDependencia.findMany({
      where: { indicador: { deletedAt: null } },
    });
    const grafo = new Map<string, string[]>();
    for (const { indicadorId, dependeDeId } of arestas) {
      grafo.set(indicadorId, [...(grafo.get(indicadorId) ?? []), dependeDeId]);
    }
    return grafo;
  },
};
```

- [ ] **Step 5: Escrever o controller**

Crie `backend/src/controllers/indicadorController.ts`:

```ts
import type { Request, Response } from "express";
import type { StatusIndicador } from "@prisma/client";
import { indicadorModel } from "../models/indicadorModel.js";
import { registrarLog } from "../helper/auditoria.js";
import { HttpError } from "../middleware/errorHandler.js";
import { parsePaginacao } from "../helper/paginacao.js";
import { validarConfig, indicadoresReferenciados } from "../helper/indicadorConfig.js";
import { ordenarPorDependencia, CicloDetectado } from "../helper/dependencias.js";
import type { CriarIndicadorInput, AtualizarIndicadorInput } from "../helper/validators.js";

/** Valida a config contra o tipo e devolve de quais indicadores este depende. */
function conferirConfig(tipo: CriarIndicadorInput["tipo"], config: unknown): string[] {
  return indicadoresReferenciados(validarConfig(tipo, config));
}

/**
 * Recusa o salvamento se a nova aresta fechar um ciclo.
 *
 * `id` precisa ser o uuid do indicador, porque é por uuid que as arestas são
 * gravadas. Na criação o uuid ainda não existe, então entra um nó sentinela:
 * ciclo na criação é impossível (nada consegue referenciar um id inexistente),
 * mas a checagem fica no mesmo caminho para não divergir das regras da edição.
 */
async function conferirCiclo(id: string, dependencias: string[]): Promise<void> {
  const grafo = await indicadorModel.grafoDeDependencias();
  grafo.set(id, dependencias);
  try {
    ordenarPorDependencia(grafo);
  } catch (erro) {
    if (erro instanceof CicloDetectado) {
      throw new HttpError(409, "DEPENDENCIA_CIRCULAR", erro.message, { ciclo: erro.ciclo });
    }
    throw erro;
  }
}

export async function listar(req: Request, res: Response) {
  const status = (typeof req.query.status === "string" ? req.query.status : undefined) as StatusIndicador | undefined;
  const { page, pageSize } = parsePaginacao(req.query, 50);
  const { total, itens } = await indicadorModel.listar({ status, page, pageSize });
  res.json({ total, page, pageSize, itens });
}

export async function obter(req: Request, res: Response) {
  const indicador = await indicadorModel.obterPorId(req.params.id);
  if (!indicador) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");
  res.json({ indicador });
}

export async function criar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const dados = req.body as CriarIndicadorInput;

  const dependencias = conferirConfig(dados.tipo, dados.config);
  await conferirCiclo("__novo__", dependencias);

  const indicador = await indicadorModel.criar(dados, usuario.id, dependencias);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: indicador.id,
    acao: "CREATE",
    usuarioId: usuario.id,
    dadosDepois: indicador,
    ip: req.ip,
  });
  res.status(201).json({ indicador });
}

export async function atualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;
  const atual = await indicadorModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");

  const dados = req.body as AtualizarIndicadorInput;
  const tipo = dados.tipo ?? (atual.tipo as CriarIndicadorInput["tipo"]);
  const dependencias = conferirConfig(tipo, dados.config ?? atual.config);
  await conferirCiclo(id, dependencias);

  const indicador = await indicadorModel.atualizar(id, dados, usuario.id, dependencias);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: id,
    acao: "UPDATE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    dadosDepois: indicador,
    ip: req.ip,
  });
  res.json({ indicador });
}

export async function remover(req: Request, res: Response) {
  const usuario = req.usuario!;
  const { id } = req.params;
  const atual = await indicadorModel.obterPorId(id);
  if (!atual) throw new HttpError(404, "NAO_ENCONTRADO", "Indicador não encontrado");

  // Apagar um MCC em silêncio deixaria o IDTC e as classificações sem base.
  const grafo = await indicadorModel.grafoDeDependencias();
  const dependentes = [...grafo.entries()].filter(([, deps]) => deps.includes(id)).map(([quem]) => quem);
  if (dependentes.length > 0) {
    throw new HttpError(409, "INDICADOR_EM_USO", "Outros indicadores dependem deste", { dependentes });
  }

  await indicadorModel.softDelete(id, usuario.id);
  await registrarLog({
    entidade: "Indicador",
    entidadeId: id,
    acao: "DELETE",
    usuarioId: usuario.id,
    dadosAntes: atual,
    ip: req.ip,
  });
  res.status(204).end();
}
```

- [ ] **Step 6: Escrever as rotas e registrá-las**

Crie `backend/src/routes/indicadorRoutes.ts`:

```ts
import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { exigirPapel } from "../middleware/roles.js";
import { validar } from "../middleware/validate.js";
import { criarIndicadorSchema, atualizarIndicadorSchema } from "../helper/validators.js";
import { listar, obter, criar, atualizar, remover } from "../controllers/indicadorController.js";

const GESTOR_ADMIN = ["GESTOR", "ADMIN"];

export const indicadorRoutes = Router();

indicadorRoutes.get("/indicadores", autenticar, listar);
indicadorRoutes.get("/indicadores/:id", autenticar, obter);
indicadorRoutes.post("/indicadores", autenticar, exigirPapel(...GESTOR_ADMIN), validar(criarIndicadorSchema), criar);
indicadorRoutes.put("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), validar(atualizarIndicadorSchema), atualizar);
indicadorRoutes.delete("/indicadores/:id", autenticar, exigirPapel(...GESTOR_ADMIN), remover);
```

Em `backend/src/routes/index.ts`, acrescente o import e o `use`:

```ts
import { indicadorRoutes } from "./indicadorRoutes.js";
// ...
apiRoutes.use(indicadorRoutes);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/indicadores.test.ts`
Expected: PASS, 8 testes.

- [ ] **Step 8: Commit**

```bash
git add backend/src/models/indicadorModel.ts backend/src/controllers/indicadorController.ts \
        backend/src/routes/indicadorRoutes.ts backend/src/routes/index.ts \
        backend/src/helper/validators.ts backend/tests/indicadores.test.ts
git commit -m "feat: cadastro de indicadores com auditoria e recusa de ciclo"
```

---

### Task 5: Avaliadores — f(resposta) por tipo

**Files:**
- Create: `backend/src/helper/motor/tipos.ts`
- Create: `backend/src/helper/motor/avaliadores.ts`
- Test: `backend/tests/motorAvaliadores.test.ts`

**Interfaces:**
- Consumes: `ConfigIndicador`, `NoExpressao` (Tarefa 2).
- Produces:
  - `export interface ItemAvaliavel { valorTexto?: string | null; valorNumero?: number | null; opcoesSelecionadas?: string[] | null }`
  - `export interface RespostaAvaliavel { id: string; itens: Map<string, ItemAvaliavel> }`
  - `export class ItemDuplicado extends Error`
  - `export function montarResposta(id: string, itens: Array<ItemAvaliavel & { perguntaId: string }>): RespostaAvaliavel`
  - `export function avaliar(config: ConfigIndicador, resposta: RespostaAvaliavel, valoresDependencias: Map<string, number | null>): number | null` — `null` significa "fora do numerador e do denominador"

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/motorAvaliadores.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { montarResposta, avaliar, ItemDuplicado } from "../src/helper/motor/avaliadores.js";
import { validarConfig } from "../src/helper/indicadorConfig.js";

const vazio = new Map<string, number | null>();

function resposta(itens: Array<{ perguntaId: string; valorNumero?: number | null; opcoesSelecionadas?: string[] }>) {
  return montarResposta("r1", itens);
}

describe("PROPORCAO", () => {
  const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });

  it("dá 100 quando a opção está no numerador", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: ["Rural"] }]), vazio)).toBe(100);
  });

  it("dá 0 quando respondeu outra coisa", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: ["Urbana"] }]), vazio)).toBe(0);
  });

  it("dá null quando não respondeu — sai do denominador", () => {
    expect(avaliar(config, resposta([{ perguntaId: "p1", opcoesSelecionadas: [] }]), vazio)).toBeNull();
    expect(avaliar(config, resposta([]), vazio)).toBeNull();
  });
});

describe("MEDIA", () => {
  const config = validarConfig("MEDIA", { perguntaId: "renda" });

  it("devolve o número respondido", () => {
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: 1200 }]), vazio)).toBe(1200);
  });

  it("zero é resposta válida, não branco", () => {
    // Renda declarada zero não pode sair do denominador: muda a média da amostra.
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: 0 }]), vazio)).toBe(0);
  });

  it("null é branco", () => {
    expect(avaliar(config, resposta([{ perguntaId: "renda", valorNumero: null }]), vazio)).toBeNull();
  });
});

describe("DERIVADA", () => {
  const imc = validarConfig("DERIVADA", {
    variaveis: { peso: "peso", altura: "altura" },
    expressao: { op: "/", esq: { var: "peso" }, dir: { op: "*", esq: { var: "altura" }, dir: { var: "altura" } } },
  });

  it("calcula o IMC", () => {
    const r = resposta([{ perguntaId: "peso", valorNumero: 64 }, { perguntaId: "altura", valorNumero: 1.6 }]);
    expect(avaliar(imc, r, vazio)).toBeCloseTo(25, 5);
  });

  it("altura zero não vira Infinity: vira sem dados", () => {
    const r = resposta([{ perguntaId: "peso", valorNumero: 64 }, { perguntaId: "altura", valorNumero: 0 }]);
    expect(avaliar(imc, r, vazio)).toBeNull();
  });

  it("falta de uma das variáveis vira sem dados", () => {
    expect(avaliar(imc, resposta([{ perguntaId: "peso", valorNumero: 64 }]), vazio)).toBeNull();
  });
});

describe("CRUZAMENTO", () => {
  const config = validarConfig("CRUZAMENTO", {
    condicoes: [
      { perguntaId: "idade", operador: "<", valor: 18 },
      { perguntaId: "escolaridade", opcoes: ["Fundamental incompleto"] },
    ],
  });

  it("dá 100 só quando todas as condições valem", () => {
    const r = resposta([
      { perguntaId: "idade", valorNumero: 16 },
      { perguntaId: "escolaridade", opcoesSelecionadas: ["Fundamental incompleto"] },
    ]);
    expect(avaliar(config, r, vazio)).toBe(100);
  });

  it("dá 0 quando uma condição falha", () => {
    const r = resposta([
      { perguntaId: "idade", valorNumero: 30 },
      { perguntaId: "escolaridade", opcoesSelecionadas: ["Fundamental incompleto"] },
    ]);
    expect(avaliar(config, r, vazio)).toBe(0);
  });

  it("dá null quando falta o dado de alguma condição", () => {
    expect(avaliar(config, resposta([{ perguntaId: "idade", valorNumero: 16 }]), vazio)).toBeNull();
  });
});

describe("COMPOSTO", () => {
  const mcc = validarConfig("COMPOSTO", {
    termos: [
      { indicadorId: "vcras", peso: 3 },
      { indicadorId: "cvac", peso: 5 },
      { indicadorId: "cpuer", peso: 5 },
    ],
    divisor: 13,
  });

  it("soma ponderada dividida pelo divisor", () => {
    const deps = new Map([["vcras", 100], ["cvac", 100], ["cpuer", 100]]);
    expect(avaliar(mcc, resposta([]), deps)).toBeCloseTo(100, 6);
  });

  it("dá null se qualquer termo estiver sem valor", () => {
    const deps = new Map<string, number | null>([["vcras", 100], ["cvac", null], ["cpuer", 100]]);
    expect(avaliar(mcc, resposta([]), deps)).toBeNull();
  });
});

describe("montarResposta", () => {
  it("recusa dois itens para a mesma pergunta", () => {
    // Dado sujo: sem isso, o último item venceria em silêncio.
    expect(() =>
      montarResposta("r1", [
        { perguntaId: "p1", valorNumero: 1 },
        { perguntaId: "p1", valorNumero: 2 },
      ]),
    ).toThrow(ItemDuplicado);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/motorAvaliadores.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Escrever os tipos compartilhados**

Crie `backend/src/helper/motor/tipos.ts`:

```ts
/** Uma resposta reduzida ao que o motor precisa: nada de Prisma aqui dentro. */
export interface ItemAvaliavel {
  valorTexto?: string | null;
  valorNumero?: number | null;
  opcoesSelecionadas?: string[] | null;
}

export interface RespostaAvaliavel {
  id: string;
  itens: Map<string, ItemAvaliavel>;
}

/**
 * Valor de um indicador para um indivíduo.
 * `null` = branco ou não aplicável: sai do numerador E do denominador.
 */
export type ValorIndividual = number | null;
```

- [ ] **Step 4: Escrever os avaliadores**

Crie `backend/src/helper/motor/avaliadores.ts`:

```ts
import type { ConfigIndicador, NoExpressao } from "../indicadorConfig.js";
import type { ItemAvaliavel, RespostaAvaliavel, ValorIndividual } from "./tipos.js";

export type { ItemAvaliavel, RespostaAvaliavel, ValorIndividual };

export class ItemDuplicado extends Error {
  constructor(respostaId: string, perguntaId: string) {
    super(`resposta ${respostaId} tem mais de um item para a pergunta ${perguntaId}`);
    this.name = "ItemDuplicado";
  }
}

export function montarResposta(
  id: string,
  itens: Array<ItemAvaliavel & { perguntaId: string }>,
): RespostaAvaliavel {
  const mapa = new Map<string, ItemAvaliavel>();
  for (const { perguntaId, ...item } of itens) {
    if (mapa.has(perguntaId)) throw new ItemDuplicado(id, perguntaId);
    mapa.set(perguntaId, item);
  }
  return { id, itens: mapa };
}

/** Zero é resposta; branco é ausência. Confundir os dois muda o denominador. */
function temNumero(item?: ItemAvaliavel): item is ItemAvaliavel & { valorNumero: number } {
  return typeof item?.valorNumero === "number" && Number.isFinite(item.valorNumero);
}

function opcoes(item?: ItemAvaliavel): string[] {
  return item?.opcoesSelecionadas ?? [];
}

function finitoOuNulo(valor: number): ValorIndividual {
  return Number.isFinite(valor) ? valor : null;
}

function avaliarExpressao(no: NoExpressao, valores: Map<string, number>): number {
  if ("const" in no) return no.const;
  if ("var" in no) return valores.get(no.var) ?? Number.NaN;
  const esq = avaliarExpressao(no.esq, valores);
  const dir = avaliarExpressao(no.dir, valores);
  switch (no.op) {
    case "+": return esq + dir;
    case "-": return esq - dir;
    case "*": return esq * dir;
    case "/": return dir === 0 ? Number.NaN : esq / dir;
  }
}

export function avaliar(
  config: ConfigIndicador,
  resposta: RespostaAvaliavel,
  valoresDependencias: Map<string, ValorIndividual>,
): ValorIndividual {
  switch (config.tipo) {
    case "PROPORCAO": {
      const selecionadas = opcoes(resposta.itens.get(config.perguntaId));
      if (selecionadas.length === 0) return null;
      return selecionadas.some((o) => config.opcoesNumerador.includes(o)) ? 100 : 0;
    }

    case "CRUZAMENTO": {
      let todas = true;
      for (const condicao of config.condicoes) {
        const item = resposta.itens.get(condicao.perguntaId);
        if (condicao.opcoes) {
          const selecionadas = opcoes(item);
          if (selecionadas.length === 0) return null;
          if (!selecionadas.some((o) => condicao.opcoes!.includes(o))) todas = false;
        } else if (condicao.operador && condicao.valor !== undefined) {
          if (!temNumero(item)) return null;
          const v = item.valorNumero;
          const alvo = condicao.valor;
          const vale =
            condicao.operador === "<" ? v < alvo :
            condicao.operador === "<=" ? v <= alvo :
            condicao.operador === ">" ? v > alvo :
            condicao.operador === ">=" ? v >= alvo : v === alvo;
          if (!vale) todas = false;
        }
      }
      return todas ? 100 : 0;
    }

    case "MEDIA": {
      const item = resposta.itens.get(config.perguntaId);
      return temNumero(item) ? item.valorNumero : null;
    }

    case "DERIVADA": {
      const valores = new Map<string, number>();
      for (const [nome, perguntaId] of Object.entries(config.variaveis)) {
        const item = resposta.itens.get(perguntaId);
        if (!temNumero(item)) return null;
        valores.set(nome, item.valorNumero);
      }
      return finitoOuNulo(avaliarExpressao(config.expressao, valores));
    }

    case "COMPOSTO": {
      let soma = 0;
      for (const termo of config.termos) {
        const valor = valoresDependencias.get(termo.indicadorId);
        if (valor === null || valor === undefined) return null;
        soma += valor * termo.peso;
      }
      return finitoOuNulo(soma / config.divisor);
    }

    // CLASSIFICACAO, CONTAGEM e DISTRIBUICAO não produzem valor individual:
    // existem só na agregação.
    default:
      return null;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/motorAvaliadores.test.ts`
Expected: PASS, 15 testes.

- [ ] **Step 6: Commit**

```bash
git add backend/src/helper/motor backend/tests/motorAvaliadores.test.ts
git commit -m "feat: avaliadores por tipo de indicador"
```

---

### Task 6: Agregação e faixas

**Files:**
- Create: `backend/src/helper/motor/agregacao.ts`
- Test: `backend/tests/motorAgregacao.test.ts`

**Interfaces:**
- Consumes: `ConfigIndicador` (Tarefa 2), `ValorIndividual` (Tarefa 5).
- Produces:
  - `export type ResultadoIndicador = { status: "OK"; valor: number } | { status: "OK_FAIXAS"; faixas: Array<{ rotulo: string; percentual: number }> } | { status: "OK_DISTRIBUICAO"; itens: Array<{ opcao: string; contagem: number; percentual: number }> } | { status: "SEM_DADOS" } | { status: "INCOMPLETO"; motivo: string; dependencia?: string }`
  - `export function agregar(config: ConfigIndicador, valores: ValorIndividual[], casasDecimais: number): ResultadoIndicador`
  - `export function agregarDistribuicao(selecoes: string[][], casasDecimais: number): ResultadoIndicador`
  - `export function classificar(valores: ValorIndividual[], faixas: Array<{ rotulo: string; de: number; ate: number }>, casasDecimais: number): ResultadoIndicador`

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/motorAgregacao.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { agregar, classificar, agregarDistribuicao } from "../src/helper/motor/agregacao.js";
import { validarConfig } from "../src/helper/indicadorConfig.js";

const FAIXAS = [
  { rotulo: "Crítico", de: 0, ate: 25 },
  { rotulo: "Baixo", de: 25, ate: 50 },
  { rotulo: "Moderado", de: 50, ate: 75 },
  { rotulo: "Alto", de: 75, ate: 100 },
];

describe("agregar", () => {
  it("PROPORCAO é a média dos 0/100, ignorando os brancos", () => {
    const config = validarConfig("PROPORCAO", { perguntaId: "p1", opcoesNumerador: ["Rural"] });
    // 2 de 4 preenchidos = 50%; os dois nulos não entram no denominador.
    expect(agregar(config, [100, 0, 100, 0, null, null], 1)).toEqual({ status: "OK", valor: 50 });
  });

  it("MEDIA arredonda conforme as casas decimais do indicador", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [1000, 1001, 1003], 2)).toEqual({ status: "OK", valor: 1001.33 });
  });

  it("devolve SEM_DADOS quando o denominador é zero", () => {
    const config = validarConfig("MEDIA", { perguntaId: "renda" });
    expect(agregar(config, [null, null], 1)).toEqual({ status: "SEM_DADOS" });
    expect(agregar(config, [], 1)).toEqual({ status: "SEM_DADOS" });
  });

  it("CONTAGEM conta os preenchidos", () => {
    const config = validarConfig("CONTAGEM", {});
    expect(agregar(config, [1, 1, null], 0)).toEqual({ status: "OK", valor: 2 });
  });
});

describe("classificar", () => {
  it("distribui os indivíduos nas faixas", () => {
    const r = classificar([10, 30, 60, 90], FAIXAS, 1);
    expect(r).toEqual({
      status: "OK_FAIXAS",
      faixas: [
        { rotulo: "Crítico", percentual: 25 },
        { rotulo: "Baixo", percentual: 25 },
        { rotulo: "Moderado", percentual: 25 },
        { rotulo: "Alto", percentual: 25 },
      ],
    });
  });

  it("valor na fronteira cai numa faixa só, e a soma fecha em 100", () => {
    // 25 pertence a "Baixo" (de <= v < ate), não a "Crítico".
    const r = classificar([25, 50, 75], FAIXAS, 1);
    if (r.status !== "OK_FAIXAS") throw new Error("esperava faixas");
    const porRotulo = Object.fromEntries(r.faixas.map((f) => [f.rotulo, f.percentual]));
    expect(porRotulo["Crítico"]).toBe(0);
    expect(r.faixas.reduce((s, f) => s + f.percentual, 0)).toBeCloseTo(100, 6);
  });

  it("o limite superior da última faixa é inclusivo", () => {
    // 100 precisa contar como "Alto"; senão some da conta.
    const r = classificar([100], FAIXAS, 1);
    if (r.status !== "OK_FAIXAS") throw new Error("esperava faixas");
    expect(r.faixas.find((f) => f.rotulo === "Alto")?.percentual).toBe(100);
  });

  it("sem ninguém classificável devolve SEM_DADOS", () => {
    expect(classificar([null, null], FAIXAS, 1)).toEqual({ status: "SEM_DADOS" });
  });
});

describe("agregarDistribuicao", () => {
  it("percentual por opção sobre quem respondeu", () => {
    const r = agregarDistribuicao([["Parda"], ["Parda"], ["Branca"], []], 1);
    expect(r).toEqual({
      status: "OK_DISTRIBUICAO",
      itens: [
        { opcao: "Parda", contagem: 2, percentual: 66.7 },
        { opcao: "Branca", contagem: 1, percentual: 33.3 },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/motorAgregacao.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Write minimal implementation**

Crie `backend/src/helper/motor/agregacao.ts`:

```ts
import type { ConfigIndicador } from "../indicadorConfig.js";
import type { ValorIndividual } from "./tipos.js";

export type ResultadoIndicador =
  | { status: "OK"; valor: number }
  | { status: "OK_FAIXAS"; faixas: Array<{ rotulo: string; percentual: number }> }
  | { status: "OK_DISTRIBUICAO"; itens: Array<{ opcao: string; contagem: number; percentual: number }> }
  | { status: "SEM_DADOS" }
  | { status: "INCOMPLETO"; motivo: string; dependencia?: string };

function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

function preenchidos(valores: ValorIndividual[]): number[] {
  return valores.filter((v): v is number => v !== null && Number.isFinite(v));
}

function media(valores: number[]): number {
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

export function agregar(
  config: ConfigIndicador,
  valores: ValorIndividual[],
  casasDecimais: number,
): ResultadoIndicador {
  const validos = preenchidos(valores);

  if (config.tipo === "CONTAGEM") {
    return { status: "OK", valor: validos.length };
  }
  // Denominador zero não é zero por cento: é ausência de base.
  if (validos.length === 0) return { status: "SEM_DADOS" };

  return { status: "OK", valor: arredondar(media(validos), casasDecimais) };
}

export function classificar(
  valores: ValorIndividual[],
  faixas: Array<{ rotulo: string; de: number; ate: number }>,
  casasDecimais: number,
): ResultadoIndicador {
  const validos = preenchidos(valores);
  if (validos.length === 0) return { status: "SEM_DADOS" };

  const contagem = new Map(faixas.map((f) => [f.rotulo, 0]));
  const ultima = faixas[faixas.length - 1];

  for (const valor of validos) {
    // `de <= v < ate`, exceto na última faixa, onde o topo é inclusivo —
    // senão o valor máximo (100) não pertenceria a faixa nenhuma.
    const faixa = faixas.find((f) =>
      f === ultima ? valor >= f.de && valor <= f.ate : valor >= f.de && valor < f.ate,
    );
    if (faixa) contagem.set(faixa.rotulo, (contagem.get(faixa.rotulo) ?? 0) + 1);
  }

  return {
    status: "OK_FAIXAS",
    faixas: faixas.map((f) => ({
      rotulo: f.rotulo,
      percentual: arredondar(((contagem.get(f.rotulo) ?? 0) / validos.length) * 100, casasDecimais),
    })),
  };
}

export function agregarDistribuicao(selecoes: string[][], casasDecimais: number): ResultadoIndicador {
  const comResposta = selecoes.filter((s) => s.length > 0);
  if (comResposta.length === 0) return { status: "SEM_DADOS" };

  const contagem = new Map<string, number>();
  for (const selecionadas of comResposta) {
    for (const opcao of selecionadas) contagem.set(opcao, (contagem.get(opcao) ?? 0) + 1);
  }

  return {
    status: "OK_DISTRIBUICAO",
    itens: [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([opcao, quantidade]) => ({
        opcao,
        contagem: quantidade,
        percentual: arredondar((quantidade / comResposta.length) * 100, casasDecimais),
      })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/motorAgregacao.test.ts`
Expected: PASS, 9 testes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/helper/motor/agregacao.ts backend/tests/motorAgregacao.test.ts
git commit -m "feat: agregacao, faixas e distribuicao dos indicadores"
```

---

### Task 7: Orquestração — ordem, recorte e propagação

**Files:**
- Create: `backend/src/helper/motor/calcular.ts`
- Test: `backend/tests/motorCalcular.test.ts`

**Interfaces:**
- Consumes: tudo das Tarefas 2, 3, 5 e 6.
- Produces:
  - `export interface IndicadorParaCalculo { id: string; codigo: string; tipo: TipoIndicador; config: unknown; casasDecimais: number; status: "ATIVO" | "DEFINICAO_INCOMPLETA" | "INATIVO"; motivoIncompleto?: string | null; recorte?: "ANTES_APOS" | null; recorteConfig?: { substituicoes: Array<{ de: string; para: string }> } | null }`
  - `export function calcular(indicadores: IndicadorParaCalculo[], respostas: RespostaAvaliavel[], perguntasExistentes: Set<string>): Map<string, ResultadoIndicador | { antes: ResultadoIndicador; apos: ResultadoIndicador }>`

- [ ] **Step 1: Write the failing test — inclui o teste dourado**

Crie `backend/tests/motorCalcular.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calcular, type IndicadorParaCalculo } from "../src/helper/motor/calcular.js";
import { montarResposta } from "../src/helper/motor/avaliadores.js";

const PERGUNTAS = new Set(["cras", "vacina", "puer", "renda"]);

function ind(parcial: Partial<IndicadorParaCalculo> & Pick<IndicadorParaCalculo, "id" | "tipo" | "config">): IndicadorParaCalculo {
  return { codigo: parcial.id, casasDecimais: 2, status: "ATIVO", ...parcial };
}

/**
 * Teste dourado: três crianças, MCC calculado no papel.
 * MCC = [(VCRAS×3) + (CVAC×5) + (CPUER×5)] ÷ 13, tudo em 0–100.
 *   A: 100,100,100 -> 1300/13 = 100
 *   B:   0,100,  0 ->  500/13 = 38.46
 *   C: 100,  0,100 ->  800/13 = 61.54
 * Média = 200/3 = 66.67
 * Faixas: A Alto, B Baixo, C Moderado -> 33.33% em cada, 0% em Crítico.
 */
const INDICADORES: IndicadorParaCalculo[] = [
  ind({ id: "vcras", tipo: "PROPORCAO", config: { perguntaId: "cras", opcoesNumerador: ["Sim"] } }),
  ind({ id: "cvac", tipo: "PROPORCAO", config: { perguntaId: "vacina", opcoesNumerador: ["Sim"] } }),
  ind({ id: "cpuer", tipo: "PROPORCAO", config: { perguntaId: "puer", opcoesNumerador: ["Sim"] } }),
  ind({
    id: "mcc",
    tipo: "COMPOSTO",
    config: {
      termos: [{ indicadorId: "vcras", peso: 3 }, { indicadorId: "cvac", peso: 5 }, { indicadorId: "cpuer", peso: 5 }],
      divisor: 13,
    },
  }),
  ind({
    id: "idtcFaixas",
    tipo: "CLASSIFICACAO",
    config: {
      indicadorId: "mcc",
      faixas: [
        { rotulo: "Crítico", de: 0, ate: 25 },
        { rotulo: "Baixo", de: 25, ate: 50 },
        { rotulo: "Moderado", de: 50, ate: 75 },
        { rotulo: "Alto", de: 75, ate: 100 },
      ],
    },
  }),
];

function crianca(id: string, cras: string, vacina: string, puer: string) {
  return montarResposta(id, [
    { perguntaId: "cras", opcoesSelecionadas: [cras] },
    { perguntaId: "vacina", opcoesSelecionadas: [vacina] },
    { perguntaId: "puer", opcoesSelecionadas: [puer] },
  ]);
}

const AMOSTRA = [
  crianca("A", "Sim", "Sim", "Sim"),
  crianca("B", "Não", "Sim", "Não"),
  crianca("C", "Sim", "Não", "Sim"),
];

describe("teste dourado do MCC", () => {
  const resultados = calcular(INDICADORES, AMOSTRA, PERGUNTAS);

  it("a média do MCC bate com a conta feita no papel", () => {
    expect(resultados.get("mcc")).toEqual({ status: "OK", valor: 66.67 });
  });

  it("as faixas distribuem as três crianças corretamente", () => {
    expect(resultados.get("idtcFaixas")).toEqual({
      status: "OK_FAIXAS",
      faixas: [
        { rotulo: "Crítico", percentual: 0 },
        { rotulo: "Baixo", percentual: 33.33 },
        { rotulo: "Moderado", percentual: 33.33 },
        { rotulo: "Alto", percentual: 33.33 },
      ],
    });
  });

  it("os termos também saem calculados", () => {
    expect(resultados.get("vcras")).toEqual({ status: "OK", valor: 66.67 });
  });
});

describe("propagação de definição incompleta", () => {
  it("quem depende de um indicador incompleto não produz número", () => {
    const comLacuna = INDICADORES.map((i) =>
      i.id === "cvac" ? { ...i, status: "DEFINICAO_INCOMPLETA" as const, motivoIncompleto: "falta régua" } : i,
    );
    const r = calcular(comLacuna, AMOSTRA, PERGUNTAS);

    expect(r.get("cvac")).toMatchObject({ status: "INCOMPLETO" });
    expect(r.get("mcc")).toMatchObject({ status: "INCOMPLETO", dependencia: "cvac" });
    // E a lacuna alcança o neto, não só o filho.
    expect(r.get("idtcFaixas")).toMatchObject({ status: "INCOMPLETO" });
  });

  it("indicador que aponta para pergunta inexistente vira incompleto, não erro", () => {
    const orfao = [ind({ id: "orfao", tipo: "MEDIA", config: { perguntaId: "apagada" } })];
    const r = calcular(orfao, AMOSTRA, PERGUNTAS);
    expect(r.get("orfao")).toMatchObject({ status: "INCOMPLETO" });
  });

  it("config inválida no banco vira incompleto, não derruba o cálculo", () => {
    const quebrado = [ind({ id: "quebrado", tipo: "PROPORCAO", config: { perguntaId: "cras" } })];
    const r = calcular(quebrado, AMOSTRA, PERGUNTAS);
    expect(r.get("quebrado")).toMatchObject({ status: "INCOMPLETO" });
  });
});

describe("recorte ANTES/APÓS", () => {
  it("devolve os dois cenários do mesmo indicador", () => {
    const perguntas = new Set(["crasAntes", "crasApos"]);
    const pareado = [
      ind({
        id: "vcras",
        tipo: "PROPORCAO",
        config: { perguntaId: "crasAntes", opcoesNumerador: ["Sim"] },
        recorte: "ANTES_APOS",
        recorteConfig: { substituicoes: [{ de: "crasAntes", para: "crasApos" }] },
      }),
    ];
    const respostas = [
      montarResposta("A", [
        { perguntaId: "crasAntes", opcoesSelecionadas: ["Não"] },
        { perguntaId: "crasApos", opcoesSelecionadas: ["Sim"] },
      ]),
      montarResposta("B", [
        { perguntaId: "crasAntes", opcoesSelecionadas: ["Não"] },
        { perguntaId: "crasApos", opcoesSelecionadas: ["Sim"] },
      ]),
    ];

    expect(calcular(pareado, respostas, perguntas).get("vcras")).toEqual({
      antes: { status: "OK", valor: 0 },
      apos: { status: "OK", valor: 100 },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/motorCalcular.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Write minimal implementation**

Crie `backend/src/helper/motor/calcular.ts`:

```ts
import {
  validarConfig,
  perguntasReferenciadas,
  indicadoresReferenciados,
  type ConfigIndicador,
  type TipoIndicador,
} from "../indicadorConfig.js";
import { ordenarPorDependencia } from "../dependencias.js";
import { avaliar } from "./avaliadores.js";
import { agregar, classificar, agregarDistribuicao, type ResultadoIndicador } from "./agregacao.js";
import type { RespostaAvaliavel, ValorIndividual } from "./tipos.js";

export interface IndicadorParaCalculo {
  id: string;
  codigo: string;
  tipo: TipoIndicador;
  config: unknown;
  casasDecimais: number;
  status: "ATIVO" | "DEFINICAO_INCOMPLETA" | "INATIVO";
  motivoIncompleto?: string | null;
  recorte?: "ANTES_APOS" | null;
  recorteConfig?: { substituicoes: Array<{ de: string; para: string }> } | null;
}

export type ResultadoComRecorte = ResultadoIndicador | { antes: ResultadoIndicador; apos: ResultadoIndicador };

/** Troca as perguntas do recorte, para avaliar o mesmo indicador no outro cenário. */
function aplicarSubstituicoes(
  config: ConfigIndicador,
  substituicoes: Array<{ de: string; para: string }>,
): ConfigIndicador {
  const mapa = new Map(substituicoes.map((s) => [s.de, s.para]));
  const trocar = (id: string) => mapa.get(id) ?? id;

  switch (config.tipo) {
    case "PROPORCAO":
    case "MEDIA":
    case "DISTRIBUICAO":
      return { ...config, perguntaId: trocar(config.perguntaId) };
    case "CRUZAMENTO":
      return { ...config, condicoes: config.condicoes.map((c) => ({ ...c, perguntaId: trocar(c.perguntaId) })) };
    case "DERIVADA":
      return {
        ...config,
        variaveis: Object.fromEntries(Object.entries(config.variaveis).map(([k, v]) => [k, trocar(v)])),
      };
    default:
      return config;
  }
}

function agregarPorTipo(
  config: ConfigIndicador,
  valores: ValorIndividual[],
  respostas: RespostaAvaliavel[],
  casasDecimais: number,
  valoresPorIndicador: Map<string, ValorIndividual[]>,
): ResultadoIndicador {
  if (config.tipo === "CLASSIFICACAO") {
    const base = valoresPorIndicador.get(config.indicadorId) ?? [];
    return classificar(base, config.faixas, casasDecimais);
  }
  if (config.tipo === "DISTRIBUICAO") {
    return agregarDistribuicao(
      respostas.map((r) => r.itens.get(config.perguntaId)?.opcoesSelecionadas ?? []),
      casasDecimais,
    );
  }
  return agregar(config, valores, casasDecimais);
}

export function calcular(
  indicadores: IndicadorParaCalculo[],
  respostas: RespostaAvaliavel[],
  perguntasExistentes: Set<string>,
): Map<string, ResultadoComRecorte> {
  const porId = new Map(indicadores.map((i) => [i.id, i]));

  const grafo = new Map<string, string[]>();
  for (const indicador of indicadores) {
    try {
      grafo.set(indicador.id, indicadoresReferenciados(validarConfig(indicador.tipo, indicador.config)));
    } catch {
      // Config inválida não impede a ordenação; vira INCOMPLETO adiante.
      grafo.set(indicador.id, []);
    }
  }

  const resultados = new Map<string, ResultadoComRecorte>();
  const valoresPorIndicador = new Map<string, ValorIndividual[]>();
  const incompletos = new Map<string, string>(); // id -> id do que travou a cadeia

  for (const id of ordenarPorDependencia(grafo)) {
    const indicador = porId.get(id)!;

    // 1. Config que não valida é definição incompleta, não exceção.
    let config: ConfigIndicador;
    try {
      config = validarConfig(indicador.tipo, indicador.config);
    } catch {
      resultados.set(id, { status: "INCOMPLETO", motivo: "configuração inválida" });
      incompletos.set(id, id);
      continue;
    }

    // 2. Marcado como incompleto no cadastro.
    if (indicador.status === "DEFINICAO_INCOMPLETA") {
      resultados.set(id, { status: "INCOMPLETO", motivo: indicador.motivoIncompleto ?? "definição pendente" });
      incompletos.set(id, id);
      continue;
    }

    // 3. Aponta para pergunta que não existe mais.
    const faltando = perguntasReferenciadas(config).find((p) => !perguntasExistentes.has(p));
    if (faltando) {
      resultados.set(id, { status: "INCOMPLETO", motivo: `pergunta ${faltando} não existe mais` });
      incompletos.set(id, id);
      continue;
    }

    // 4. Depende de alguém incompleto: a lacuna propaga, nunca vira zero.
    const travado = indicadoresReferenciados(config).find((dep) => incompletos.has(dep));
    if (travado) {
      const raiz = incompletos.get(travado)!;
      resultados.set(id, { status: "INCOMPLETO", motivo: `depende de ${travado}`, dependencia: travado });
      incompletos.set(id, raiz);
      continue;
    }

    const calcularCenario = (cfg: ConfigIndicador): { valores: ValorIndividual[]; resultado: ResultadoIndicador } => {
      const dependencias = indicadoresReferenciados(cfg);
      const valores = respostas.map((resposta, indice) => {
        const deps = new Map<string, ValorIndividual>();
        for (const depId of dependencias) {
          // Posição, não busca: o valor do MCC da criança i está em valores[i].
          deps.set(depId, valoresPorIndicador.get(depId)?.[indice] ?? null);
        }
        return avaliar(cfg, resposta, deps);
      });
      return { valores, resultado: agregarPorTipo(cfg, valores, respostas, indicador.casasDecimais, valoresPorIndicador) };
    };

    const antes = calcularCenario(config);
    valoresPorIndicador.set(id, antes.valores);

    if (indicador.recorte === "ANTES_APOS" && indicador.recorteConfig) {
      const apos = calcularCenario(aplicarSubstituicoes(config, indicador.recorteConfig.substituicoes));
      resultados.set(id, { antes: antes.resultado, apos: apos.resultado });
    } else {
      resultados.set(id, antes.resultado);
    }
  }

  return resultados;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/motorCalcular.test.ts`
Expected: PASS, 7 testes. Se o teste dourado falhar por centésimo, confira a ordem: a média é dos MCC individuais, não dos termos agregados.

- [ ] **Step 5: Commit**

```bash
git add backend/src/helper/motor/calcular.ts backend/tests/motorCalcular.test.ts
git commit -m "feat: orquestracao do calculo com recorte e propagacao de lacuna"
```

---

### Task 8: Carregar respostas com os filtros do painel

**Files:**
- Create: `backend/src/models/indicadorCalculoModel.ts`
- Create: `backend/src/helper/filtrosIndicador.ts`
- Modify: `backend/src/models/respostaModel.ts` (acrescentar `regional` ao filtro)
- Modify: `backend/src/controllers/respostaController.ts` (`extrairFiltrosBase`)
- Test: `backend/tests/filtrosIndicador.test.ts`

**Interfaces:**
- Consumes: `montarResposta` (Tarefa 5).
- Produces:
  - `export interface FiltrosIndicador { pesquisaId?: string; municipio?: string; regional?: string; sexo?: string; de?: Date; ate?: Date }`
  - `export function extrairFiltrosIndicador(query: Request["query"]): FiltrosIndicador`
  - `export function chaveDeCache(filtros: FiltrosIndicador): string`
  - `indicadorCalculoModel.carregarRespostas(filtros)` → `RespostaAvaliavel[]`
  - `indicadorCalculoModel.perguntasExistentes()` → `Set<string>`

**Nota:** `regional` está gravado em `Resposta` e sai na exportação, mas **não** é filtro hoje — `extrairFiltrosBase` cobre município, unidade, status e período. Esta tarefa acrescenta. `sexo` não é campo de `Resposta`: é resposta a uma pergunta, então filtra por `itens`.

- [ ] **Step 1: Write the failing test**

Crie `backend/tests/filtrosIndicador.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extrairFiltrosIndicador, chaveDeCache } from "../src/helper/filtrosIndicador.js";

describe("extrairFiltrosIndicador", () => {
  it("lê os quatro filtros do painel", () => {
    const f = extrairFiltrosIndicador({
      municipio: "Maceió",
      regional: "1ª Regional – Maceió",
      sexo: "Feminino",
      de: "2026-01-01",
      ate: "2026-06-30",
    });
    expect(f.municipio).toBe("Maceió");
    expect(f.regional).toBe("1ª Regional – Maceió");
    expect(f.sexo).toBe("Feminino");
    expect(f.de?.toISOString().slice(0, 10)).toBe("2026-01-01");
  });

  it("ignora data inválida em vez de gerar filtro impossível", () => {
    expect(extrairFiltrosIndicador({ de: "ontem" }).de).toBeUndefined();
  });

  it("ignora parâmetro repetido (array na query)", () => {
    expect(extrairFiltrosIndicador({ municipio: ["Maceió", "Arapiraca"] }).municipio).toBeUndefined();
  });
});

describe("chaveDeCache", () => {
  it("filtros iguais em ordem diferente geram a mesma chave", () => {
    const a = chaveDeCache({ municipio: "Maceió", sexo: "Feminino" });
    const b = chaveDeCache({ sexo: "Feminino", municipio: "Maceió" });
    expect(a).toBe(b);
  });

  it("filtros diferentes geram chaves diferentes", () => {
    expect(chaveDeCache({ municipio: "Maceió" })).not.toBe(chaveDeCache({ municipio: "Arapiraca" }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/filtrosIndicador.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Escrever o helper de filtros**

Crie `backend/src/helper/filtrosIndicador.ts`:

```ts
import type { Request } from "express";

export interface FiltrosIndicador {
  pesquisaId?: string;
  municipio?: string;
  regional?: string;
  sexo?: string;
  de?: Date;
  ate?: Date;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() !== "" ? valor : undefined;
}

function data(valor: unknown): Date | undefined {
  const bruto = texto(valor);
  if (!bruto) return undefined;
  const d = new Date(bruto);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function extrairFiltrosIndicador(query: Request["query"]): FiltrosIndicador {
  return {
    pesquisaId: texto(query.pesquisaId),
    municipio: texto(query.municipio),
    regional: texto(query.regional),
    sexo: texto(query.sexo),
    de: data(query.de),
    ate: data(query.ate),
  };
}

/** Chave estável do cache: a ordem dos filtros não pode gerar entrada nova. */
export function chaveDeCache(filtros: FiltrosIndicador): string {
  const partes = Object.entries(filtros)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : String(v)}`)
    .sort();
  return partes.join("&");
}
```

- [ ] **Step 4: Escrever o carregamento de respostas**

Crie `backend/src/models/indicadorCalculoModel.ts`:

```ts
import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import { montarResposta, type RespostaAvaliavel } from "../helper/motor/avaliadores.js";
import type { FiltrosIndicador } from "../helper/filtrosIndicador.js";

export const indicadorCalculoModel = {
  /** Só respostas aprovadas e não excluídas entram em indicador. */
  async carregarRespostas(filtros: FiltrosIndicador): Promise<RespostaAvaliavel[]> {
    const where: Prisma.RespostaWhereInput = { deletedAt: null, status: "APROVADA" };
    if (filtros.pesquisaId) where.pesquisaId = filtros.pesquisaId;
    if (filtros.municipio) where.municipio = filtros.municipio;
    if (filtros.regional) where.regional = filtros.regional;
    if (filtros.de || filtros.ate) {
      where.enviadaEm = {
        ...(filtros.de ? { gte: filtros.de } : {}),
        ...(filtros.ate ? { lte: filtros.ate } : {}),
      };
    }
    // Sexo não é campo da resposta: é resposta a uma pergunta.
    if (filtros.sexo) {
      where.itens = {
        some: {
          pergunta: { enunciado: { contains: "Sexo biológico", mode: "insensitive" } },
          opcoesSelecionadas: { has: filtros.sexo },
        },
      };
    }

    const respostas = await prisma.resposta.findMany({
      where,
      select: {
        id: true,
        itens: {
          select: { perguntaId: true, valorTexto: true, valorNumero: true, opcoesSelecionadas: true },
        },
      },
    });

    return respostas.map((r) => montarResposta(r.id, r.itens));
  },

  async perguntasExistentes(): Promise<Set<string>> {
    const perguntas = await prisma.pergunta.findMany({ select: { id: true } });
    return new Set(perguntas.map((p) => p.id));
  },
};
```

- [ ] **Step 5: Acrescentar `regional` ao filtro compartilhado**

Em `backend/src/models/respostaModel.ts`, acrescente à interface `ListarRespostasFiltros`:

```ts
  regional?: string;
```

e dentro de `construirWhere`, logo após a linha de `municipio`:

```ts
  if (filtros.regional) where.regional = filtros.regional;
```

Em `backend/src/controllers/respostaController.ts`, dentro de `extrairFiltrosBase`, acrescente:

```ts
    regional: parseQueryString(query.regional),
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/filtrosIndicador.test.ts`
Expected: PASS, 5 testes.

- [ ] **Step 7: Rodar a suíte inteira, para garantir que o filtro novo não quebrou nada**

Run: `cd backend && npm test`
Expected: todos os testes passam, inclusive `respostas.test.ts` e `export.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/helper/filtrosIndicador.ts backend/src/models/indicadorCalculoModel.ts \
        backend/src/models/respostaModel.ts backend/src/controllers/respostaController.ts \
        backend/tests/filtrosIndicador.test.ts
git commit -m "feat: filtros de indicador e carga de respostas aprovadas"
```

---

### Task 9: Endpoint de cálculo com cache

**Files:**
- Create: `backend/src/helper/cacheIndicadores.ts`
- Modify: `backend/src/controllers/indicadorController.ts`
- Modify: `backend/src/routes/indicadorRoutes.ts`
- Test: `backend/tests/cacheIndicadores.test.ts`
- Test: `backend/tests/indicadoresCalculo.test.ts`

**Interfaces:**
- Consumes: `calcular` (Tarefa 7), `indicadorCalculoModel`, `chaveDeCache` (Tarefa 8), `indicadorModel.listarAtivos` (Tarefa 4).
- Produces:
  - `export function lerCache(chave: string)`, `export function gravarCache(chave, valor)`, `export function invalidarCache()`
  - rota `GET /api/indicadores/calculo`

- [ ] **Step 1: Write the failing test do cache**

Crie `backend/tests/cacheIndicadores.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { lerCache, gravarCache, invalidarCache } from "../src/helper/cacheIndicadores.js";

beforeEach(() => invalidarCache());

describe("cache de indicadores", () => {
  it("devolve o que foi gravado", () => {
    gravarCache("municipio=Maceió", { total: 1 });
    expect(lerCache("municipio=Maceió")).toEqual({ total: 1 });
  });

  it("não mistura filtros diferentes", () => {
    gravarCache("municipio=Maceió", { total: 1 });
    expect(lerCache("municipio=Arapiraca")).toBeUndefined();
  });

  it("invalidar limpa tudo — resposta aprovada muda todo indicador", () => {
    gravarCache("a", { total: 1 });
    gravarCache("b", { total: 2 });
    invalidarCache();
    expect(lerCache("a")).toBeUndefined();
    expect(lerCache("b")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/cacheIndicadores.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Escrever o cache**

Crie `backend/src/helper/cacheIndicadores.ts`:

```ts
/**
 * Cache em memória dos cálculos, invalidado por evento.
 *
 * Limitação assumida e registrada na spec: com mais de uma réplica da API,
 * cada uma teria seu próprio cache e os números poderiam divergir por alguns
 * segundos até a próxima invalidação.
 */

const cache = new Map<string, unknown>();

export function lerCache<T>(chave: string): T | undefined {
  return cache.get(chave) as T | undefined;
}

export function gravarCache(chave: string, valor: unknown): void {
  cache.set(chave, valor);
}

/** Uma resposta aprovada ou um indicador editado muda todo o conjunto. */
export function invalidarCache(): void {
  cache.clear();
}
```

- [ ] **Step 4: Run cache test to verify it passes**

Run: `cd backend && npx vitest run tests/cacheIndicadores.test.ts`
Expected: PASS, 3 testes.

- [ ] **Step 5: Write the failing test do endpoint**

Crie `backend/tests/indicadoresCalculo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/indicadorModel.js");
vi.mock("../src/models/indicadorCalculoModel.js");
vi.mock("../src/helper/auditoria.js");

import { createApp } from "../src/app.js";
import { indicadorModel } from "../src/models/indicadorModel.js";
import { indicadorCalculoModel } from "../src/models/indicadorCalculoModel.js";
import { invalidarCache } from "../src/helper/cacheIndicadores.js";
import { montarResposta } from "../src/helper/motor/avaliadores.js";
import { gerarToken } from "../src/helper/token.js";

const app = createApp();
const token = gerarToken({ sub: "u1", papel: "VISUALIZADOR" });

beforeEach(() => {
  vi.clearAllMocks();
  invalidarCache();
  vi.mocked(indicadorModel.listarAtivos).mockResolvedValue([
    {
      id: "vcras", codigo: "VCRAS", tipo: "PROPORCAO", casasDecimais: 1, status: "ATIVO",
      config: { perguntaId: "cras", opcoesNumerador: ["Sim"] }, recorte: null, recorteConfig: null,
    },
  ] as never);
  vi.mocked(indicadorCalculoModel.perguntasExistentes).mockResolvedValue(new Set(["cras"]));
  vi.mocked(indicadorCalculoModel.carregarRespostas).mockResolvedValue([
    montarResposta("A", [{ perguntaId: "cras", opcoesSelecionadas: ["Sim"] }]),
    montarResposta("B", [{ perguntaId: "cras", opcoesSelecionadas: ["Não"] }]),
  ]);
});

describe("GET /api/indicadores/calculo", () => {
  it("calcula e devolve o valor por indicador", async () => {
    const res = await request(app).get("/api/indicadores/calculo").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.resultados.VCRAS).toEqual({ status: "OK", valor: 50 });
  });

  it("exige autenticação -> 401", async () => {
    expect((await request(app).get("/api/indicadores/calculo")).status).toBe(401);
  });

  it("a segunda chamada com os mesmos filtros não recarrega do banco", async () => {
    await request(app).get("/api/indicadores/calculo?municipio=Maceió").set("Authorization", `Bearer ${token}`);
    await request(app).get("/api/indicadores/calculo?municipio=Maceió").set("Authorization", `Bearer ${token}`);
    expect(indicadorCalculoModel.carregarRespostas).toHaveBeenCalledOnce();
  });

  it("filtros diferentes não compartilham cache", async () => {
    await request(app).get("/api/indicadores/calculo?municipio=Maceió").set("Authorization", `Bearer ${token}`);
    await request(app).get("/api/indicadores/calculo?municipio=Arapiraca").set("Authorization", `Bearer ${token}`);
    expect(indicadorCalculoModel.carregarRespostas).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/indicadoresCalculo.test.ts`
Expected: FAIL — 404, a rota não existe.

- [ ] **Step 7: Escrever o endpoint**

Acrescente a `backend/src/controllers/indicadorController.ts`:

```ts
import { indicadorCalculoModel } from "../models/indicadorCalculoModel.js";
import { extrairFiltrosIndicador, chaveDeCache } from "../helper/filtrosIndicador.js";
import { lerCache, gravarCache, invalidarCache } from "../helper/cacheIndicadores.js";
import { calcular, type IndicadorParaCalculo } from "../helper/motor/calcular.js";

export async function calculo(req: Request, res: Response) {
  const filtros = extrairFiltrosIndicador(req.query);
  const chave = chaveDeCache(filtros);

  const emCache = lerCache<Record<string, unknown>>(chave);
  if (emCache) return res.json({ resultados: emCache, cache: true });

  const [indicadores, respostas, perguntas] = await Promise.all([
    indicadorModel.listarAtivos(),
    indicadorCalculoModel.carregarRespostas(filtros),
    indicadorCalculoModel.perguntasExistentes(),
  ]);

  const calculados = calcular(indicadores as unknown as IndicadorParaCalculo[], respostas, perguntas);

  // A chave pública é o código, não o uuid: é o que o painel e a planilha usam.
  const porCodigo = new Map((indicadores as IndicadorParaCalculo[]).map((i) => [i.id, i.codigo]));
  const resultados = Object.fromEntries(
    [...calculados.entries()].map(([id, resultado]) => [porCodigo.get(id) ?? id, resultado]),
  );

  gravarCache(chave, resultados);
  res.json({ resultados, cache: false });
}
```

E invalide o cache em toda escrita: acrescente `invalidarCache();` logo antes do `res` final de `criar`, `atualizar` e `remover`.

Em `backend/src/routes/indicadorRoutes.ts`, **antes** da rota `/indicadores/:id` (senão `calculo` é lido como id):

```ts
indicadorRoutes.get("/indicadores/calculo", autenticar, calculo);
```

e acrescente `calculo` ao import do controller.

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/indicadoresCalculo.test.ts`
Expected: PASS, 4 testes.

- [ ] **Step 9: Rodar a suíte inteira e o type-check**

Run: `cd backend && npm test && npm run build`
Expected: todos os testes passam e o `tsc` compila sem erro.

- [ ] **Step 10: Commit**

```bash
git add backend/src/helper/cacheIndicadores.ts backend/src/controllers/indicadorController.ts \
        backend/src/routes/indicadorRoutes.ts backend/tests/cacheIndicadores.test.ts \
        backend/tests/indicadoresCalculo.test.ts
git commit -m "feat: endpoint de calculo de indicadores com cache por filtro"
```

---

## Ao fim deste plano

Existe API para cadastrar indicador (`POST /api/indicadores`, ADMIN e GESTOR) e para obter os números (`GET /api/indicadores/calculo`, qualquer autenticado), com filtros de pesquisa, município, regional, sexo e período. O cálculo é por indivíduo e depois agregado, respeita a ordem de dependência, recusa ciclo no cadastro, devolve os dois cenários nos indicadores pareados, e nunca inventa número: lacuna de definição propaga como `INCOMPLETO`, denominador zero vira `SEM_DADOS`.

Fica para os planos seguintes: importação das 108 linhas da planilha (fase 3) e painel (fase 4).
