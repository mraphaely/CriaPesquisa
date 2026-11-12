import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export type AcaoLog =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "PUBLICAR"
  | "ENCERRAR"
  | "ARQUIVAR"
  | "DESARQUIVAR"
  | "APROVAR"
  | "REPROVAR";

export interface RegistroLog {
  id: string;
  entidade: string;
  entidadeId: string;
  acao: AcaoLog;
  usuarioId: string;
  dadosAntes: unknown;
  dadosDepois: unknown;
  ip: string | null;
  createdAt: string;
  usuario: { nome: string; email: string } | null;
}

export interface FiltrosLogs {
  entidade?: string;
  acao?: AcaoLog;
  de?: string;
  ate?: string;
}

export interface ListaLogs {
  itens: RegistroLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const TAMANHO_PAGINA_LOGS = 20;

export function useLogs(filtros: FiltrosLogs, pagina = 1) {
  return useQuery<ListaLogs>({
    queryKey: ["logs", filtros, pagina],
    queryFn: async () => {
      const { data } = await api.get<ListaLogs>("/logs", {
        params: { ...filtros, page: pagina, pageSize: TAMANHO_PAGINA_LOGS },
      });
      return data;
    },
    // Mantém a página atual na tela enquanto a próxima carrega.
    placeholderData: keepPreviousData,
  });
}
