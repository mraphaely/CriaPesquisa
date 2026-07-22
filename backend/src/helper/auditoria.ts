import type { AcaoLog } from "@prisma/client";
import { logModel } from "../models/logModel.js";

export interface RegistrarLogEntrada {
  entidade: string;
  entidadeId: string;
  acao: AcaoLog;
  usuarioId: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ip?: string;
}

export async function registrarLog(entrada: RegistrarLogEntrada): Promise<void> {
  await logModel.registrar(entrada);
}
