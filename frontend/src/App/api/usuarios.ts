import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export type Papel = "ADMIN" | "GESTOR" | "COLETADOR" | "VISUALIZADOR";

export interface NovoUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
}

export function useCriarUsuario() {
  return useMutation({
    mutationFn: async (dados: NovoUsuarioPayload) => {
      const { data } = await api.post("/usuarios", dados);
      return data;
    },
  });
}
