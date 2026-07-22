import { ThemeModeProvider } from "./theme/ThemeModeContext.js";

export function App() {
  return (
    <ThemeModeProvider>
      <main>
        <h1>CriaPesquisa</h1>
      </main>
    </ThemeModeProvider>
  );
}
