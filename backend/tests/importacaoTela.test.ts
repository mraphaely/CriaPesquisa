import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/sessaoModel.js", async () => (await import("./helpers/sessao.js")).moduloSessaoFalso);
vi.mock("../src/helper/importacao/importar.js", async (original) => ({
  ...(await original<typeof import("../src/helper/importacao/importar.js")>()),
  importarIndicadores: vi.fn(),
}));
vi.mock("../src/helper/importacao/ativar.js", () => ({ ativarIndicadoresProntos: vi.fn() }));
vi.mock("../src/helper/cacheIndicadores.js", async (original) => ({
  ...(await original<typeof import("../src/helper/cacheIndicadores.js")>()),
  invalidarCache: vi.fn(),
}));

import { createApp } from "../src/app.js";
import { tokenDe } from "./helpers/sessao.js";
import { importarIndicadores, type ResumoImportacao } from "../src/helper/importacao/importar.js";
import { ativarIndicadoresProntos } from "../src/helper/importacao/ativar.js";
import { ErroImportacao } from "../src/helper/importacao/planilha.js";
import { invalidarCache } from "../src/helper/cacheIndicadores.js";

const app = createApp();
const tokenAdmin = tokenDe("a1", "ADMIN");
const tokenGestor = tokenDe("g1", "GESTOR");
const tokenColetador = tokenDe("c1", "COLETADOR");

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const BYTES = Buffer.from("PK\u0003\u0004 planilha de teste");

const RESUMO: ResumoImportacao = {
  lidas: 110,
  importadas: 120,
  jaExistiam: 0,
  porSituacao: { DEFINICAO_PRONTA: ["1"], PERGUNTA_SUGERIDA: [], AMBIGUA: [], SEM_CANDIDATA: [], SEM_DESCRICAO: [] },
  auxiliares: 18,
  semId: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(importarIndicadores).mockResolvedValue(RESUMO);
  vi.mocked(ativarIndicadoresProntos).mockResolvedValue({ ativados: ["MCC"], recusados: [] });
});

const enviar = (token: string, corpo: Buffer | string = BYTES, tipo = XLSX) =>
  request(app).post("/api/indicadores/importar").set("Authorization", `Bearer ${token}`).set("Content-Type", tipo).send(corpo);

describe("POST /api/indicadores/importar", () => {
  it("ADMIN envia a planilha: importa os bytes, ativa os prontos, limpa o cache e devolve o resumo", async () => {
    const res = await enviar(tokenAdmin);

    expect(res.status).toBe(200);
    const [fonte, usuarioId, opcoes] = vi.mocked(importarIndicadores).mock.calls[0];
    expect(Buffer.isBuffer(fonte)).toBe(true);
    expect((fonte as Buffer).equals(BYTES)).toBe(true);
    expect(usuarioId).toBe("a1");
    expect(opcoes).toMatchObject({ origem: expect.stringContaining("tela") });
    expect(ativarIndicadoresProntos).toHaveBeenCalledWith("a1", expect.objectContaining({ papel: "ADMIN" }));
    expect(invalidarCache).toHaveBeenCalled();
    expect(res.body).toMatchObject({ resumo: { lidas: 110, importadas: 120 }, ativacao: { ativados: ["MCC"] } });
    expect(res.body.texto).toMatch(/110 lidas/);
  });

  it("GESTOR também pode importar", async () => {
    const res = await enviar(tokenGestor);
    expect(res.status).toBe(200);
  });

  it("COLETADOR -> 403 e nada é importado", async () => {
    const res = await enviar(tokenColetador);
    expect(res.status).toBe(403);
    expect(importarIndicadores).not.toHaveBeenCalled();
  });

  it("sem arquivo -> 400", async () => {
    const res = await request(app)
      .post("/api/indicadores/importar")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ARQUIVO_AUSENTE");
    expect(importarIndicadores).not.toHaveBeenCalled();
  });

  it("planilha com problema (ErroImportacao) -> 422 com a mensagem, sem ativar", async () => {
    vi.mocked(importarIndicadores).mockRejectedValue(new ErroImportacao("cabeçalho da planilha mudou: coluna 3"));

    const res = await enviar(tokenAdmin);

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({ code: "PLANILHA_INVALIDA", message: "cabeçalho da planilha mudou: coluna 3" });
    expect(ativarIndicadoresProntos).not.toHaveBeenCalled();
  });

  it("falha interna -> 500 sem vazar a mensagem", async () => {
    vi.mocked(importarIndicadores).mockRejectedValue(new Error("conexão caiu"));

    const res = await enviar(tokenAdmin);

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("conexão caiu");
  });

  it("arquivo acima do limite -> 413 com recado claro", async () => {
    const res = await enviar(tokenAdmin, Buffer.alloc(11 * 1024 * 1024, 1));

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("ARQUIVO_GRANDE");
    expect(importarIndicadores).not.toHaveBeenCalled();
  });
});
