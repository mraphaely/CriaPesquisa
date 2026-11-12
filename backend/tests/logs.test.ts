import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/models/sessaoModel.js", async () => (await import("./helpers/sessao.js")).moduloSessaoFalso);
vi.mock("../src/models/logModel.js");

import { createApp } from "../src/app.js";
import { tokenDe } from "./helpers/sessao.js";
import { logModel } from "../src/models/logModel.js";

const app = createApp();
const tokenAdmin = tokenDe("a1", "ADMIN");
const tokenGestor = tokenDe("g1", "GESTOR");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logs", () => {
  it("ADMIN lista auditoria -> 200", async () => {
    vi.mocked(logModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    const res = await request(app).get("/api/logs").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 0, itens: [] });
  });

  it("GESTOR (sem permissão) -> 403", async () => {
    const res = await request(app).get("/api/logs").set("Authorization", `Bearer ${tokenGestor}`);
    expect(res.status).toBe(403);
  });

  it("repassa os filtros de entidade, ação e usuário", async () => {
    vi.mocked(logModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    const res = await request(app)
      .get("/api/logs?entidade=Pesquisa&acao=ARQUIVAR&usuarioId=u9")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(logModel.listar).toHaveBeenCalledWith(
      expect.objectContaining({ entidade: "Pesquisa", acao: "ARQUIVAR", usuarioId: "u9" }),
    );
  });

  it("ação desconhecida -> ignorada", async () => {
    vi.mocked(logModel.listar).mockResolvedValue({ total: 0, itens: [] } as never);
    await request(app).get("/api/logs?acao=HACK").set("Authorization", `Bearer ${tokenAdmin}`);
    expect(logModel.listar).toHaveBeenCalledWith(expect.objectContaining({ acao: undefined }));
  });

  it("sem token -> 401", async () => {
    const res = await request(app).get("/api/logs");
    expect(res.status).toBe(401);
  });
});
