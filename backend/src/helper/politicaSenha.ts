import { z } from "zod";

/**
 * Política de senha do CriaPesquisa.
 *
 * Seguimos a orientação atual do NIST (SP 800-63B): o que protege é comprimento
 * somado a uma lista de bloqueio, não regra de composição. Exigir maiúscula,
 * número e símbolo produz "Senha@123" e senha colada no monitor — pior, não
 * melhor. Por isso aqui vale: comprimento mínimo generoso, recusa de senhas
 * óbvias e de repetição/sequência; nada de exigir símbolo.
 */
export const SENHA_TAMANHO_MINIMO = 10;

/** Raízes que, sozinhas ou com números na ponta, não podem virar senha. */
const RAIZES_PROIBIDAS = [
  "senha",
  "password",
  "cria",
  "criapesquisa",
  "secria",
  "alagoas",
  "primeirainfancia",
  "admin",
  "usuario",
  "gestor",
  "coletador",
  "qwerty",
  "qwertyuiop",
  "asdfgh",
  "abcdef",
  "iloveyou",
];

/** "123456789012", "abcdefghij" — teclado/alfabeto em ordem. */
function ehSequencia(texto: string): boolean {
  if (texto.length < 4) return false;
  let crescente = true;
  let decrescente = true;
  for (let i = 1; i < texto.length; i++) {
    const passo = texto.charCodeAt(i) - texto.charCodeAt(i - 1);
    if (passo !== 1) crescente = false;
    if (passo !== -1) decrescente = false;
  }
  return crescente || decrescente;
}

function ehRepeticao(texto: string): boolean {
  return new Set(texto).size === 1;
}

/** Tira números das pontas para que "senha123456" caia na raiz "senha". */
function nucleo(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();
}

function ehObvia(senha: string): boolean {
  const semEspacos = senha.replace(/\s/g, "");
  if (ehRepeticao(semEspacos)) return true;
  if (ehSequencia(semEspacos)) return true;

  const raiz = nucleo(senha);
  // Sem nenhuma letra é PIN, não senha: o espaço de busca cabe num ataque curto.
  if (raiz.length === 0) return true;

  // Só barra quando a parte em letras É a raiz proibida:
  // "primeirainfancia2026alagoas" tem mais substância do que "cria12345678".
  return RAIZES_PROIBIDAS.includes(raiz);
}

export const senhaForte = z
  .string()
  .min(SENHA_TAMANHO_MINIMO, `A senha precisa ter ao menos ${SENHA_TAMANHO_MINIMO} caracteres.`)
  .refine((senha) => !ehObvia(senha), {
    message: "Escolha uma senha menos previsível: evite sequências, repetições e palavras óbvias.",
  });
