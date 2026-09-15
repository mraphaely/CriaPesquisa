import { createContext, useMemo, useState, type ReactNode } from "react";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  foto?: string;
  /** Conta com senha definida por outra pessoa: precisa trocar antes de usar. */
  precisaTrocarSenha?: boolean;
};
export type AuthValor = {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
  entrar: (t: string, u: Usuario, lembrar?: boolean) => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  sair: () => void;
};

export const AuthCtx = createContext<AuthValor | null>(null);

// O token pode estar no localStorage ("lembrar-me") ou no sessionStorage (só a sessão).
const lerToken = () => localStorage.getItem("token") ?? sessionStorage.getItem("token");
const lerUsuario = (): Usuario | null => {
  const raw = localStorage.getItem("usuario") ?? sessionStorage.getItem("usuario");
  return raw ? (JSON.parse(raw) as Usuario) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(lerToken);
  const [usuario, setUsuario] = useState<Usuario | null>(lerUsuario);
  const valor = useMemo<AuthValor>(
    () => ({
      usuario,
      token,
      autenticado: Boolean(token),
      entrar: (t, u, lembrar = true) => {
        const store = lembrar ? localStorage : sessionStorage;
        const outro = lembrar ? sessionStorage : localStorage;
        store.setItem("token", t);
        store.setItem("usuario", JSON.stringify(u));
        outro.removeItem("token");
        outro.removeItem("usuario");
        setToken(t);
        setUsuario(u);
      },
      /** Atualiza o usuário guardado sem refazer login (ex.: após trocar a senha). */
      atualizarUsuario: (dados) => {
        setUsuario((atual) => {
          if (!atual) return atual;
          const novo = { ...atual, ...dados };
          const store = localStorage.getItem("token") ? localStorage : sessionStorage;
          store.setItem("usuario", JSON.stringify(novo));
          return novo;
        });
      },
      sair: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");
        setToken(null);
        setUsuario(null);
      },
    }),
    [usuario, token],
  );
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}
