import { useThemeMode } from "../../App/theme/ThemeModeContext.js";

export function ThemeToggle() {
  const { modo, alternar } = useThemeMode();
  return (
    <button type="button" onClick={alternar} aria-label="alternar tema">
      {modo === "claro" ? "🌙 Escuro" : "☀️ Claro"}
    </button>
  );
}
