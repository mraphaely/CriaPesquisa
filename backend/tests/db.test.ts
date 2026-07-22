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
