import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export interface TrocaDeSenha {
  senhaAtual: string;
  senhaNova: string;
}

export function useTrocarSenha() {
  return useMutation({
    mutationFn: async (dados: TrocaDeSenha) => {
      await api.put("/auth/senha", dados);
    },
  });
}
