import { useState, type CSSProperties } from "react";

type Variante = "branca" | "colorida" | "azul";

// Cores dos caracteres por variante (aproximação da logo do CRIA).
const CORES: Record<Variante, [string, string, string, string]> = {
  colorida: ["#E6417A", "#18A5C4", "#F39312", "#8BC53F"],
  branca: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
  azul: ["#1756B8", "#1756B8", "#1756B8", "#1756B8"],
};

// Cor do contorno (a "linha" em volta do nome cria).
const CONTORNO: Record<Variante, string> = {
  colorida: "#C9CDD6",
  branca: "rgba(255,255,255,0.85)",
  azul: "#C9CDD6",
};

/**
 * Logo do CRIA. Usa `public/cria-<variante>.png` quando existir; senão,
 * cai num wordmark "cria" com contorno (fonte arredondada) parecido com a logo.
 * Arquivos esperados: public/cria-branca.png, cria-colorida.png, cria-azul.png
 */
export function Logo({ variante, altura = 34 }: { variante: Variante; altura?: number }) {
  const [erro, setErro] = useState(false);

  if (!erro) {
    return (
      <img
        src={`/cria-${variante}.png`}
        alt="CRIA"
        onError={() => setErro(true)}
        style={{ height: altura, width: "auto", display: "block" }}
      />
    );
  }

  const letras = ["c", "r", "i", "a"];
  const cores = CORES[variante];
  const larguraLinha = Math.max(2, altura * 0.09);

  const wordmark: CSSProperties = {
    fontFamily: "'Baloo 2', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: altura,
    lineHeight: 1,
    letterSpacing: "-0.5px",
    display: "inline-flex",
    // contorno em volta das letras (paint-order: stroke desenha a linha atrás do preenchimento)
    WebkitTextStroke: `${larguraLinha}px ${CONTORNO[variante]}`,
    paintOrder: "stroke",
  };

  return (
    <span style={wordmark} aria-label="CRIA">
      {letras.map((l, i) => (
        <span key={i} style={{ color: cores[i] }}>
          {l}
        </span>
      ))}
    </span>
  );
}
