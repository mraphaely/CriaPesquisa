import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios.js";
import type { Usuario } from "../auth/AuthContext.js";

export function useLogin() {
  return useMutation({
    mutationFn: async (dados: { email: string; senha: string }) => {
      const { data } = await api.post<{ token: string; usuario: Usuario }>("/auth/login", dados);
      return data;
    },
  });
}
