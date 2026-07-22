import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import { pesquisaModel } from "../models/pesquisaModel.js";

export async function snapshotPesquisa(pesquisaId: string, usuarioId: string): Promise<void> {
  const pesquisa = await pesquisaModel.obterPorId(pesquisaId);
  if (!pesquisa) return;

  const ultima = await prisma.pesquisaVersao.findFirst({
    where: { pesquisaId },
    orderBy: { versao: "desc" },
  });
  const proximaVersao = (ultima?.versao ?? 0) + 1;

  await prisma.$transaction([
    prisma.pesquisaVersao.create({
      data: {
        pesquisaId,
        versao: proximaVersao,
        snapshot: pesquisa as unknown as Prisma.InputJsonValue,
        usuarioId,
      },
    }),
    prisma.pesquisa.update({
      where: { id: pesquisaId },
      data: { versaoAtual: proximaVersao },
    }),
  ]);
}
