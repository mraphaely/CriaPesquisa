import styled from "styled-components";
import { useThemeMode } from "../../App/theme/ThemeModeContext.js";

const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surfaceAlt};
  color: ${(p) => p.theme.cores.text};
  transition: background 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.border}; }
`;

export function ThemeToggle() {
  const { modo, alternar } = useThemeMode();
  return (
    <Toggle type="button" onClick={alternar} aria-label="alternar tema">
      {modo === "claro" ? "🌙 Escuro" : "☀️ Claro"}
    </Toggle>
  );
}
