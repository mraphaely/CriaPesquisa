import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios.js";

export type Papel = "ADMIN" | "GESTOR" | "COLETADOR" | "VISUALIZADOR";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
}

export interface NovoUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
}

export interface AtualizarUsuarioPayload {
  nome?: string;
  email?: string;
  papel?: Papel;
  ativo?: boolean;
  senha?: string;
}

export function useUsuarios() {
  return useQuery<{ itens: Usuario[] }>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get<{ itens: Usuario[] }>("/usuarios");
      return { itens: data.itens };
    },
  });
}

export function useUsuario(id: string | undefined) {
  return useQuery<Usuario | null>({
    queryKey: ["usuario", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ usuario: Usuario }>(`/usuarios/${id}`);
      return data.usuario;
    },
  });
}

export function useCriarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: NovoUsuarioPayload) => {
      const { data } = await api.post("/usuarios", dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useAtualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: AtualizarUsuarioPayload }) => {
      const { data } = await api.put(`/usuarios/${id}`, dados);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuario", vars.id] });
    },
  });
}
