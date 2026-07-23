import { useState } from "react";

type Variante = "branca" | "colorida" | "azul";

/**
 * Logo do CRIA. Usa o arquivo em `public/cria-<variante>.png` quando existir;
 * caso contrário, cai num wordmark estilizado (para não quebrar o layout).
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

  const base: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: altura,
    lineHeight: 1,
    letterSpacing: "-1px",
  };

  if (variante === "colorida") {
    return (
      <span style={base} aria-label="CRIA">
        <span style={{ color: "#E11D63" }}>c</span>
        <span style={{ color: "#12A5C4" }}>r</span>
        <span style={{ color: "#F39312" }}>i</span>
        <span style={{ color: "#8BC53F" }}>a</span>
      </span>
    );
  }

  return (
    <span style={{ ...base, color: variante === "branca" ? "#FFFFFF" : "#0B2D6E" }} aria-label="CRIA">
      cria
    </span>
  );
}
