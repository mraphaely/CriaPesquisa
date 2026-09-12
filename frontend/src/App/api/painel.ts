import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios.js";
import type { Municipio } from "../data/cria.js";

export interface Distribuicao {
  labels: string[];
  data: number[];
}

export interface Painel {
  periodo: { ano: number; mes: number; mesNome: string } | null;
  totais: {
    totalBeneficiarios: number;
    criancas: number;
    gestantes: number;
    municipios: number;
    investimentoMensal: number;
  };
  municipios: Municipio[];
  investimento: Distribuicao;
  beneficios: { label: string; quantidade: number }[];
  distribuicoes: { raca: Distribuicao; zona: Distribuicao };
  pesquisas: { total: number; publicadas: number };
  respostas: { total: number; pendentes: number };
}

export function usePainel() {
  return useQuery<Painel>({
    queryKey: ["painel"],
    queryFn: async () => {
      const { data } = await api.get<Painel>("/painel");
      return data;
    },
  });
}
