import type { Request } from "express";
import { HttpError } from "../middleware/errorHandler.js";

export interface FiltrosIndicador {
  pesquisaId?: string;
  municipio?: string;
  regional?: string;
  sexo?: string;
  de?: Date;
  ate?: Date;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() !== "" ? valor : undefined;
}

/** Data ilegível é recusada: ignorá-la devolveria o período inteiro como se fosse o pedido. */
function data(valor: unknown, campo: "de" | "ate"): Date | undefined {
  const bruto = texto(valor);
  if (!bruto) return undefined;
  const d = new Date(bruto);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(422, "FILTRO_INVALIDO", `Data inválida em "${campo}"`, { [campo]: bruto });
  }
  return d;
}

export function extrairFiltrosIndicador(query: Request["query"]): FiltrosIndicador {
  return {
    pesquisaId: texto(query.pesquisaId),
    municipio: texto(query.municipio),
    regional: texto(query.regional),
    sexo: texto(query.sexo),
    de: data(query.de, "de"),
    ate: data(query.ate, "ate"),
  };
}

/** Chave estável do cache: a ordem dos filtros não pode gerar entrada nova. */
export function chaveDeCache(filtros: FiltrosIndicador): string {
  const partes = Object.entries(filtros)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : String(v)}`)
    .sort();
  return partes.join("&");
}
