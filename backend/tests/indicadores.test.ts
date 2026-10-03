import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";

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
  vi.mocked(indicadorModel.idsAtivos).mockImplementation(async (ids: string[]) => ids);
  vi.mocked(indicadorModel.pesquisaExiste).mockResolvedValue(true);
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

  it("codigo duplicado (P2002) -> 409 CODIGO_DUPLICADO", async () => {
    vi.mocked(indicadorModel.criar).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "x" }),
    );
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send(CORPO_VALIDO);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CODIGO_DUPLICADO");
    expect(registrarLog).not.toHaveBeenCalled();
  });

  it("dependência para indicador inexistente/apagado -> 422 e não grava", async () => {
    vi.mocked(indicadorModel.idsAtivos).mockResolvedValue([]);
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ codigo: "X", nome: "X", tipo: "COMPOSTO", config: { termos: [{ indicadorId: "fantasma", peso: 1 }], divisor: 1 } });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("DEPENDENCIA_INEXISTENTE");
    expect(indicadorModel.criar).not.toHaveBeenCalled();
  });

  it("pesquisaId inexistente -> 422 e não grava", async () => {
    vi.mocked(indicadorModel.pesquisaExiste).mockResolvedValue(false);
    const res = await request(app)
      .post("/api/indicadores")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ ...CORPO_VALIDO, pesquisaId: "7b8f6a52-3c1d-4e9a-8f10-2d5b6c7e8a90" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("PESQUISA_INEXISTENTE");
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

  it("codigo duplicado na edição (P2002) -> 409", async () => {
    vi.mocked(indicadorModel.obterPorId).mockResolvedValue({ id: "i1", tipo: "PROPORCAO", config: CORPO_VALIDO.config } as never);
    vi.mocked(indicadorModel.atualizar).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "x" }),
    );
    const res = await request(app)
      .put("/api/indicadores/i1")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ codigo: "JA_EXISTE" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CODIGO_DUPLICADO");
  });

  it("dependência para indicador inexistente na edição -> 422", async () => {
    vi.mocked(indicadorModel.obterPorId).mockResolvedValue({ id: "i1", tipo: "PROPORCAO", config: CORPO_VALIDO.config } as never);
    vi.mocked(indicadorModel.idsAtivos).mockResolvedValue([]);
    const res = await request(app)
      .put("/api/indicadores/i1")
      .set("Authorization", `Bearer ${tokenGestor}`)
      .send({ tipo: "COMPOSTO", config: { termos: [{ indicadorId: "fantasma", peso: 1 }], divisor: 1 } });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("DEPENDENCIA_INEXISTENTE");
    expect(indicadorModel.atualizar).not.toHaveBeenCalled();
  });
});

describe("GET /api/indicadores", () => {
  it("qualquer papel autenticado lista -> 200", async () => {
    vi.mocked(indicadorModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    const res = await request(app).get("/api/indicadores").set("Authorization", `Bearer ${tokenColetador}`);
    expect(res.status).toBe(200);
  });

  it("status inválido na query -> 422 sem consultar o model", async () => {
    const res = await request(app).get("/api/indicadores?status=lixo").set("Authorization", `Bearer ${tokenGestor}`);
    expect(res.status).toBe(422);
    expect(indicadorModel.listar).not.toHaveBeenCalled();
  });

  it("status válido na query é repassado ao model", async () => {
    vi.mocked(indicadorModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    await request(app).get("/api/indicadores?status=ATIVO").set("Authorization", `Bearer ${tokenGestor}`);
    expect(indicadorModel.listar).toHaveBeenCalledWith(expect.objectContaining({ status: "ATIVO" }));
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
