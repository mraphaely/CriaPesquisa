// Ativa os indicadores que a importação trouxe com a definição já decidida
// (motivo "definição pronta — conferir e ativar"). Idempotente: o que já está
// ativo não é tocado. Cada ativação passa pelo MESMO caminho da tela de revisão
// (indicadorController.atualizar): validação completa da config, referências,
// perguntas, recorte, ciclo e registro na auditoria.
// Indicador que a API recusaria continua "para revisar" e aparece no resultado.
// Usado pelo script (scripts/ativar-indicadores-prontos.ts) e pela importação na tela.
import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { atualizar } from "../../controllers/indicadorController.js";

export const MOTIVO_PRONTA = "definição pronta";

export type ResultadoAtivacao = { ativados: string[]; recusados: Array<{ codigo: string; motivo: string }> };

export async function ativarIndicadoresProntos(
  usuarioId: string,
  opcoes: { prefixoCodigo?: string; papel?: string; origem?: string } = {},
): Promise<ResultadoAtivacao> {
  const prontos = await prisma.indicador.findMany({
    where: {
      deletedAt: null,
      status: "DEFINICAO_INCOMPLETA",
      motivoIncompleto: { startsWith: MOTIVO_PRONTA },
      ...(opcoes.prefixoCodigo ? { codigo: { startsWith: opcoes.prefixoCodigo } } : {}),
    },
    select: { id: true, codigo: true },
    orderBy: { createdAt: "asc" },
  });

  const resultado: ResultadoAtivacao = { ativados: [], recusados: [] };
  for (const indicador of prontos) {
    const req = {
      params: { id: indicador.id },
      body: { status: "ATIVO" },
      usuario: { id: usuarioId, papel: opcoes.papel ?? "ADMIN" },
      ip: opcoes.origem ?? "script ativar-indicadores-prontos",
    } as unknown as Request;
    const res = { json: () => res } as unknown as Response;
    try {
      await atualizar(req, res);
      resultado.ativados.push(indicador.codigo);
    } catch (erro) {
      resultado.recusados.push({ codigo: indicador.codigo, motivo: erro instanceof Error ? erro.message : String(erro) });
    }
  }
  return resultado;
}
