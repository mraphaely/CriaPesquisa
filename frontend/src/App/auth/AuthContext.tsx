import { createContext, useMemo, useState, type ReactNode } from "react";

export type Usuario = { id: string; nome: string; email: string; papel: string };
export type AuthValor = { usuario: Usuario | null; token: string | null; autenticado: boolean; entrar: (t: string, u: Usuario) => void; sair: () => void };

export const AuthCtx = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? (JSON.parse(raw) as Usuario) : null;
  });
  const valor = useMemo<AuthValor>(() => ({
    usuario, token, autenticado: Boolean(token),
    entrar: (t, u) => { localStorage.setItem("token", t); localStorage.setItem("usuario", JSON.stringify(u)); setToken(t); setUsuario(u); },
    sair: () => { localStorage.removeItem("token"); localStorage.removeItem("usuario"); setToken(null); setUsuario(null); },
  }), [usuario, token]);
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}
