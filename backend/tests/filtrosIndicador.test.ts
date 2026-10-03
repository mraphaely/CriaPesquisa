import { describe, it, expect } from "vitest";
import { extrairFiltrosIndicador, chaveDeCache } from "../src/helper/filtrosIndicador.js";

describe("extrairFiltrosIndicador", () => {
  it("lê os quatro filtros do painel", () => {
    const f = extrairFiltrosIndicador({
      municipio: "Maceió",
      regional: "1ª Regional – Maceió",
      sexo: "Feminino",
      de: "2026-01-01",
      ate: "2026-06-30",
    });
    expect(f.municipio).toBe("Maceió");
    expect(f.regional).toBe("1ª Regional – Maceió");
    expect(f.sexo).toBe("Feminino");
    expect(f.de?.toISOString().slice(0, 10)).toBe("2026-01-01");
  });

  it("ignora data inválida em vez de gerar filtro impossível", () => {
    expect(extrairFiltrosIndicador({ de: "ontem" }).de).toBeUndefined();
  });

  it("ignora parâmetro repetido (array na query)", () => {
    expect(extrairFiltrosIndicador({ municipio: ["Maceió", "Arapiraca"] }).municipio).toBeUndefined();
  });
});

describe("chaveDeCache", () => {
  it("filtros iguais em ordem diferente geram a mesma chave", () => {
    const a = chaveDeCache({ municipio: "Maceió", sexo: "Feminino" });
    const b = chaveDeCache({ sexo: "Feminino", municipio: "Maceió" });
    expect(a).toBe(b);
  });

  it("filtro ausente (undefined) não altera a chave", () => {
    expect(chaveDeCache({ municipio: "Maceió", sexo: undefined })).toBe(chaveDeCache({ municipio: "Maceió" }));
  });

  it("filtros diferentes geram chaves diferentes", () => {
    expect(chaveDeCache({ municipio: "Maceió" })).not.toBe(chaveDeCache({ municipio: "Arapiraca" }));
  });
});
