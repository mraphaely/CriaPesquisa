import styled from "styled-components";
import { Sun, Moon } from "lucide-react";
import { useThemeMode } from "../../App/theme/ThemeModeContext.js";

const Botao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surfaceAlt};
  color: ${(p) => p.theme.cores.text};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.border}; }
`;

export function ThemeToggle() {
  const { modo, alternar } = useThemeMode();
  return (
    <Botao
      type="button"
      onClick={alternar}
      aria-label="alternar tema"
      title={modo === "claro" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {modo === "claro" ? <Moon size={18} /> : <Sun size={18} />}
    </Botao>
  );
}
