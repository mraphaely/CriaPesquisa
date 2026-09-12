import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios.js";
import type { RespostaPayload } from "./pesquisas.js";

export type StatusResposta = "PENDENTE" | "APROVADA" | "REPROVADA";

export interface PessoaResumo {
  id: string;
  nome: string;
  papel: string;
}

export interface RespostaRegistro {
  id: string;
  municipio: string | null;
  unidade: string | null;
  status: StatusResposta;
  observacao: string | null;
  enviadaEm: string;
  revisadoEm: string | null;
  coletador: PessoaResumo | null;
  revisadoPor: PessoaResumo | null;
}

export interface ItemResposta {
  perguntaId: string;
  valorTexto: string | null;
  valorNumero: number | null;
  valorData: string | null;
  opcoesSelecionadas: string[];
}

export interface RespostaDetalhe extends RespostaRegistro {
  itens: ItemResposta[];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRespostas(pesquisaId?: string, status?: StatusResposta) {
  return useQuery<{ itens: RespostaRegistro[]; total: number }>({
    queryKey: ["respostas", pesquisaId, status ?? "TODAS"],
    enabled: Boolean(pesquisaId),
    queryFn: async () => {
      const q = status ? `?status=${status}` : "";
      const { data } = await api.get<{ itens: RespostaRegistro[]; total: number }>(
        `/pesquisas/${pesquisaId}/respostas${q}`,
      );
      return { itens: data.itens, total: data.total };
    },
  });
}

export function useResposta(respostaId?: string) {
  return useQuery<RespostaDetalhe | null>({
    queryKey: ["resposta", respostaId],
    enabled: Boolean(respostaId),
    queryFn: async () => {
      const { data } = await api.get<{ resposta: RespostaDetalhe }>(`/respostas/${respostaId}`);
      return data.resposta;
    },
  });
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["respostas"] });
  qc.invalidateQueries({ queryKey: ["resumo"] });
  qc.invalidateQueries({ queryKey: ["painel"] });
}

export function useAprovarResposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/respostas/${id}/aprovar`);
      return data;
    },
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useReprovarResposta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao?: string }) => {
      const { data } = await api.post(`/respostas/${id}/reprovar`, { observacao });
      return data;
    },
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useAtualizarResposta(respostaId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: RespostaPayload) => {
      const { data } = await api.put(`/respostas/${respostaId}`, dados);
      return data;
    },
    onSuccess: () => {
      invalidarTudo(qc);
      qc.invalidateQueries({ queryKey: ["resposta", respostaId] });
    },
  });
}
