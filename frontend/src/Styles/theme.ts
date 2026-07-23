import { tokens } from "./tokens.js";

export const temaClaro = { modo: "claro", cores: tokens.claro } as const;
export const temaEscuro = { modo: "escuro", cores: tokens.escuro } as const;

// Tipo "largo" (modo como união, cores como string) usado para o augmentation do
// DefaultTheme do styled-components. `typeof temaClaro` sozinho fixaria `modo` no
// literal "claro" e as cores nos literais do tema claro, fazendo o TypeScript
// rejeitar `temaEscuro` como tema válido no `ThemeProvider`.
export type Cores = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  sidebar: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarActive: string;
  shadow: string;
  success: string;
  danger: string;
  warn: string;
};

export type Tema = {
  modo: "claro" | "escuro";
  cores: Cores;
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Tema {}
}
