import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

/**
 * Sonda de saúde usada por balanceador/orquestrador para decidir se manda
 * tráfego. Uma API que responde "ok" sem conseguir falar com o banco é pior que
 * uma fora do ar: continua recebendo requisições e falhando uma a uma.
 *
 * O motivo da falha fica no log do servidor, não na resposta — a mensagem do
 * driver carrega host, porta e usuário do banco, e este endpoint é público.
 */
export async function health(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (erro) {
    console.error("[health] banco inacessível:", erro);
    return res.status(503).json({ status: "degradado", service: "criapesquisa", banco: "fora" });
  }

  return res.json({ status: "ok", service: "criapesquisa", banco: "ok" });
}
