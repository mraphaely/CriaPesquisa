import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/prisma.js", () => ({
  prisma: { indicador: { findMany: vi.fn() } },
}));
vi.mock("../src/controllers/indicadorController.js", () => ({ atualizar: vi.fn() }));

import { prisma } from "../src/config/prisma.js";
import { atualizar } from "../src/controllers/indicadorController.js";
import { HttpError } from "../src/middleware/errorHandler.js";
import { ativarIndicadoresProntos } from "../src/helper/importacao/ativar.js";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(prisma.indicador.findMany).mockResolvedValue([{ id: "i1", codigo: "C-1" }] as never);
});

describe("ativarIndicadoresProntos: motivo da recusa", () => {
  it("recusa de validação mostra o motivo da API", async () => {
    vi.mocked(atualizar).mockRejectedValue(new HttpError(422, "PERGUNTA_INCOMPATIVEL", "Configuração não confere com as perguntas"));
    const r = await ativarIndicadoresProntos("u1");
    expect(r.recusados).toEqual([{ codigo: "C-1", motivo: "Configuração não confere com as perguntas" }]);
  });

  it("erro interno não vaza a mensagem técnica", async () => {
    vi.mocked(atualizar).mockRejectedValue(new Error("connection to 10.0.0.5:5432 refused"));
    const r = await ativarIndicadoresProntos("u1");
    expect(r.recusados).toEqual([{ codigo: "C-1", motivo: "erro interno ao ativar" }]);
    expect(console.error).toHaveBeenCalled();
  });
});
