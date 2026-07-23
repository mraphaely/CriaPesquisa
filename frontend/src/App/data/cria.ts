// Dados embutidos do Cartão CRIA (demonstração offline). Substituídos pelos
// dados reais da API quando o backend + PostgreSQL estiverem conectados.

export interface Municipio {
  municipio: string;
  total: number;
  criancas: number;
  gestantes: number;
}

export const MUNICIPIOS: Municipio[] = [
  { municipio: "Maceió", total: 22390, criancas: 21924, gestantes: 459 },
  { municipio: "Arapiraca", total: 6223, criancas: 5977, gestantes: 231 },
  { municipio: "Rio Largo", total: 3053, criancas: 2929, gestantes: 122 },
  { municipio: "União dos Palmares", total: 2448, criancas: 2291, gestantes: 150 },
  { municipio: "Penedo", total: 2398, criancas: 2262, gestantes: 132 },
  { municipio: "Santana do Ipanema", total: 2383, criancas: 2227, gestantes: 148 },
  { municipio: "Coruripe", total: 2350, criancas: 2227, gestantes: 119 },
  { municipio: "Palmeira dos Índios", total: 2306, criancas: 2185, gestantes: 110 },
  { municipio: "Marechal Deodoro", total: 2187, criancas: 2115, gestantes: 68 },
  { municipio: "Delmiro Gouveia", total: 1992, criancas: 1867, gestantes: 115 },
  { municipio: "São Miguel dos Campos", total: 1944, criancas: 1822, gestantes: 115 },
  { municipio: "Girau do Ponciano", total: 1944, criancas: 1820, gestantes: 120 },
  { municipio: "São José da Tapera", total: 1835, criancas: 1706, gestantes: 122 },
  { municipio: "Maragogi", total: 1709, criancas: 1661, gestantes: 47 },
  { municipio: "Pilar", total: 1689, criancas: 1585, gestantes: 97 },
  { municipio: "São Luís do Quitunde", total: 1646, criancas: 1563, gestantes: 80 },
  { municipio: "Atalaia", total: 1580, criancas: 1512, gestantes: 66 },
  { municipio: "Piranhas", total: 1456, criancas: 1315, gestantes: 133 },
  { municipio: "Craíbas", total: 1436, criancas: 1338, gestantes: 95 },
  { municipio: "Limoeiro de Anadia", total: 1431, criancas: 1328, gestantes: 99 },
  { municipio: "São Sebastião", total: 1388, criancas: 1291, gestantes: 93 },
  { municipio: "Porto Calvo", total: 1327, criancas: 1253, gestantes: 74 },
  { municipio: "Feira Grande", total: 1279, criancas: 1171, gestantes: 101 },
  { municipio: "Teotônio Vilela", total: 1256, criancas: 1196, gestantes: 56 },
  { municipio: "Murici", total: 1255, criancas: 1220, gestantes: 33 },
];

export const TOTAIS = {
  totalBeneficiarios: 121300,
  criancas: 115100,
  gestantes: 6200,
  municipios: 102,
  investimentoMensal: 15700000,
};

export const RACA = {
  labels: ["Parda", "Branca", "Preta", "Indígena", "Amarela"],
  data: [81.7, 12.8, 4.1, 0.8, 0.6],
};

export const ZONA = {
  labels: ["Urbana", "Rural"],
  data: [86.9, 13.1],
};

export const FAIXA_ETARIA = {
  labels: ["0–1a", "1–2a", "2–3a", "3–4a", "4–5a", "5–6a"],
  criancas: [18200, 22400, 20800, 19500, 18100, 16100],
};

export const ESCOLARIDADE = {
  labels: ["Não estudou", "Fund. Inc.", "Fund. Comp.", "Méd. Inc.", "Méd. Comp.", "Superior"],
  data: [3.2, 31.4, 12.8, 18.6, 28.2, 5.8],
};

export const INVESTIMENTO = {
  labels: ["Jan/24", "Fev/24", "Mar/24", "Abr/24", "Mai/24", "Jun/24", "Jul/24", "Ago/24", "Set/24", "Out/24", "Nov/24", "Dez/24", "Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25"],
  data: [11.91, 12.19, 12.49, 12.78, 12.99, 13.19, 13.47, 13.77, 14.03, 14.2, 14.49, 14.71, 14.99, 15.24, 15.45, 15.58, 15.65, 15.72],
};

export const ALIMENTACAO_ANTES_DEPOIS = {
  labels: ["Sempre", "Quase sempre", "Raramente", "Nunca"],
  antes: [14.2, 40.1, 35.4, 10.3],
  apos: [48.6, 34.1, 14.8, 2.5],
};

// Escala de cor (choropleth) — do claro ao azul CRIA escuro.
export function corPorValor(valor: number, max: number): string {
  const r = Math.min(valor / max, 1);
  if (r > 0.18) return "#0B2D6E";
  if (r > 0.08) return "#1756B8";
  if (r > 0.04) return "#3A8EF0";
  if (r > 0.018) return "#78BBFF";
  if (r > 0.007) return "#B8DCFF";
  return "#D9ECFF";
}

export const PALETA = ["#0B2D6E", "#1756B8", "#3A8EF0", "#78BBFF", "#D9ECFF"];
