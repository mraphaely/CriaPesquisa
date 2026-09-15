/**
 * Paginação vinda da query string. O teto existe para que ninguém possa pedir
 * `?pageSize=999999` e levar a tabela inteira de respostas numa só requisição —
 * são dados de beneficiários (LGPD), além do peso no banco.
 *
 * O limite mora aqui, na borda: chamadas internas que precisam de tudo (o export
 * de relatório, por exemplo) falam direto com o model e não passam por esta função.
 */
export const PAGE_SIZE_MAX = 200;

export interface Paginacao {
  page: number;
  pageSize: number;
}

function inteiroPositivo(valor: unknown): number | undefined {
  if (typeof valor !== "string") return undefined;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 1) return undefined;
  return Math.trunc(numero);
}

export function parsePaginacao(query: Record<string, unknown>, pageSizePadrao: number): Paginacao {
  const pageSize = inteiroPositivo(query.pageSize) ?? pageSizePadrao;
  return {
    page: inteiroPositivo(query.page) ?? 1,
    pageSize: Math.min(pageSize, PAGE_SIZE_MAX),
  };
}
