import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export type TipoPergunta = "TEXTO" | "NUMERO" | "DATA" | "MULTIPLA_ESCOLHA" | "ESCOLHA_UNICA" | "CAMPO_ABERTO";

export interface OpcaoPayload {
  texto: string;
  ordem: number;
}

export interface PerguntaPayload {
  enunciado: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
  opcoes?: OpcaoPayload[];
}

export interface NovaPesquisaPayload {
  titulo: string;
  descricao?: string;
  responsavelId: string;
  periodoInicio?: string;
  periodoFim?: string;
  perguntas: PerguntaPayload[];
}

export function useCriarPesquisa() {
  return useMutation({
    mutationFn: async (dados: NovaPesquisaPayload) => {
      const { perguntas, ...pesquisa } = dados;
      const { data } = await api.post("/pesquisas", pesquisa);
      const id: string = data?.pesquisa?.id ?? data?.id;
      for (const pergunta of perguntas) {
        await api.post(`/pesquisas/${id}/perguntas`, pergunta);
      }
      return { id };
    },
  });
}
