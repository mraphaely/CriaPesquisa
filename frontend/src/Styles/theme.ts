import { tokens } from "./tokens.js";

export const temaClaro = { modo: "claro", cores: tokens.claro } as const;
export const temaEscuro = { modo: "escuro", cores: tokens.escuro } as const;

// Tipo "largo" (modo como união, cores como string) usado para o augmentation do
// DefaultTheme do styled-components. `typeof temaClaro` sozinho não serve aqui:
// ele fixa `modo` no literal "claro", o que faria o TypeScript rejeitar
// `temaEscuro` como tema válido no `ThemeProvider`.
export type Tema = {
  modo: "claro" | "escuro";
  cores: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryDark: string;
    accent: string;
  };
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Tema {}
}
