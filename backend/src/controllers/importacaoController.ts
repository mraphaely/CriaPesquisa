import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { importarIndicadores, formatarResumo } from "../helper/importacao/importar.js";
import { ativarIndicadoresProntos } from "../helper/importacao/ativar.js";
import { ErroImportacao } from "../helper/importacao/planilha.js";
import { invalidarCache } from "../helper/cacheIndicadores.js";

/**
 * Importação da planilha "Exportação Indicadores" pela tela — os passos 7 e 8 do
 * roteiro de deploy num clique. O corpo é o próprio .xlsx (bytes crus): o arquivo
 * só é lido em memória, nunca gravado em disco, e as colunas pessoais (DtRegistro,
 * Usuario) não são lidas. Idempotente como o script: reenviar não sobrescreve nada.
 * Roda no processo da API, então limpar o cache basta (sem reiniciar).
 */
export async function importarPlanilha(req: Request, res: Response) {
  const usuario = req.usuario!;
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, "ARQUIVO_AUSENTE", "Envie a planilha .xlsx");
  }

  let resumo;
  try {
    resumo = await importarIndicadores(req.body, usuario.id, { origem: "importação pela tela" });
  } catch (erro) {
    if (erro instanceof ErroImportacao) throw new HttpError(422, "PLANILHA_INVALIDA", erro.message);
    throw erro;
  }

  const ativacao = await ativarIndicadoresProntos(usuario.id, { papel: usuario.papel, origem: "importação pela tela" });
  invalidarCache();

  res.json({ resumo, ativacao, texto: formatarResumo(resumo) });
}
