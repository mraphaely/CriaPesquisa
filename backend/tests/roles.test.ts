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
