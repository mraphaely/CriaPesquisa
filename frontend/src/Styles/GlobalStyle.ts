import { createGlobalStyle } from "styled-components";
export const GlobalStyle = createGlobalStyle`
  body { background: ${(p) => p.theme.cores.bg}; color: ${(p) => p.theme.cores.text}; margin: 0; font-family: Inter, system-ui, sans-serif; }
`;
