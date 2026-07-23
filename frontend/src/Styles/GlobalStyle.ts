import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html, body, #root { height: 100%; }

  body {
    margin: 0;
    background: ${(p) => p.theme.cores.bg};
    color: ${(p) => p.theme.cores.text};
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    transition: background 0.2s ease, color 0.2s ease;
  }

  h1, h2, h3, h4 {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    color: ${(p) => p.theme.cores.text};
  }

  a { color: inherit; text-decoration: none; }

  button { font-family: inherit; }

  input, select, textarea { font-family: inherit; }

  :focus-visible {
    outline: 2px solid ${(p) => p.theme.cores.accent};
    outline-offset: 2px;
  }

  ::selection {
    background: ${(p) => p.theme.cores.accent};
    color: #fff;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.cores.border};
    border-radius: 8px;
  }
  ::-webkit-scrollbar-thumb:hover { background: ${(p) => p.theme.cores.textMuted}; }
`;
