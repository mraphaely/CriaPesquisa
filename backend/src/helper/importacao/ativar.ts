// Ativa os indicadores que a importação trouxe com a definição já decidida
// (motivo "definição pronta — conferir e ativar"). Idempotente: o que já está
// ativo não é tocado. Cada ativação passa pelo MESMO caminho da tela de revisão
// (indicadorController.atualizar): validação completa da config, referências,
// perguntas, recorte, ciclo e registro na auditoria.
// Indicador que a API recusaria continua "para revisar" e aparece no resultado.
// Usado pelo script (scripts/ativar-indicadores-prontos.ts) e pela importação na tela.
import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ZodError } from "zod";
import { atualizar } from "../../controllers/indicadorController.js";
import { HttpError } from "../../middleware/errorHandler.js";

export const MOTIVO_PRONTA = "definição pronta";

/**
 * O resultado aparece na tela: só recusa de validação (o mesmo recado que a tela de
 * revisão daria) vai como está. Erro interno fica no log do servidor, não na tela.
 */
function motivoDaRecusa(erro: unknown, codigo: string): string {
  if (erro instanceof HttpError) return erro.message;
  if (erro instanceof ZodError) return erro.issues.map((i) => i.message).join("; ");
  console.error(`[ativar-indicadores] erro interno ao ativar ${codigo}:`, erro);
  return "erro interno ao ativar";
}

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
      resultado.recusados.push({ codigo: indicador.codigo, motivo: motivoDaRecusa(erro, indicador.codigo) });
    }
  }
  return resultado;
}
