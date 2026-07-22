import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { temaClaro, temaEscuro } from "../../Styles/theme.js";
import { GlobalStyle } from "../../Styles/GlobalStyle.js";

type Modo = "claro" | "escuro";
const Ctx = createContext<{ modo: Modo; alternar: () => void } | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>(() => (localStorage.getItem("tema") as Modo) ?? "claro");
  useEffect(() => {
    localStorage.setItem("tema", modo);
    document.documentElement.setAttribute("data-theme", modo);
  }, [modo]);
  const valor = useMemo(() => ({ modo, alternar: () => setModo((m) => (m === "claro" ? "escuro" : "claro")) }), [modo]);
  return (
    <Ctx.Provider value={valor}>
      <ThemeProvider theme={modo === "claro" ? temaClaro : temaEscuro}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeMode fora do ThemeModeProvider");
  return ctx;
}
