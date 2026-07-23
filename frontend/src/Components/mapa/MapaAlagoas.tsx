import { useEffect, useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import { MUNICIPIOS, corPorValor } from "../../App/data/cria.js";

type Coord = [number, number];
interface Geometria {
  type: "Polygon" | "MultiPolygon" | string;
  coordinates: unknown;
}
interface Feature {
  properties: { name?: string; nome?: string };
  geometry: Geometria;
}

function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const dadoPorMun = new Map(MUNICIPIOS.map((m) => [norm(m.municipio), m]));
const maxTotal = Math.max(...MUNICIPIOS.map((m) => m.total));

function forEachCoord(geometry: Geometria, cb: (c: Coord) => void) {
  const walk = (coords: unknown): void => {
    if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
      cb(coords as Coord);
      return;
    }
    if (Array.isArray(coords)) coords.forEach(walk);
  };
  walk(geometry.coordinates);
}

function criarProjecao(features: Feature[], w: number, h: number, margin: number) {
  let somaLat = 0;
  let n = 0;
  features.forEach((f) => forEachCoord(f.geometry, ([, lat]) => { somaLat += lat; n++; }));
  const cosLat = Math.cos(((n ? somaLat / n : -9.6) * Math.PI) / 180) || 1;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  features.forEach((f) =>
    forEachCoord(f.geometry, ([lon, lat]) => {
      const x = lon * cosLat;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, lat); maxY = Math.max(maxY, lat);
    }),
  );
  const escala = Math.min((w - margin * 2) / (maxX - minX), (h - margin * 2) / (maxY - minY));
  const offX = (w - (maxX - minX) * escala) / 2;
  const offY = (h - (maxY - minY) * escala) / 2;
  return ([lon, lat]: Coord): Coord => [offX + (lon * cosLat - minX) * escala, offY + (maxY - lat) * escala];
}

function anelParaPath(ring: Coord[], project: (c: Coord) => Coord): string {
  if (!ring?.length) return "";
  return ring.map((pt, i) => { const [x, y] = project(pt); return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`; }).join(" ") + " Z";
}

function geometriaParaPath(geometry: Geometria, project: (c: Coord) => Coord): string {
  const coords = geometry.coordinates as Coord[][] | Coord[][][];
  if (geometry.type === "Polygon") return (coords as Coord[][]).map((r) => anelParaPath(r, project)).join(" ");
  if (geometry.type === "MultiPolygon") return (coords as Coord[][][]).map((p) => p.map((r) => anelParaPath(r, project)).join(" ")).join(" ");
  return "";
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
  background: ${(p) => (p.theme.modo === "escuro" ? "#0d1a30" : "linear-gradient(150deg,#dcecff,#c2ddff)")};
  border-radius: 12px;
  overflow: hidden;
  min-height: 320px;
`;

const Path = styled.path`
  stroke: ${(p) => (p.theme.modo === "escuro" ? "#0d1a30" : "#ffffff")};
  stroke-width: 0.7;
  cursor: pointer;
  transition: opacity 0.12s ease, filter 0.12s ease;
  &:hover { opacity: 0.82; filter: drop-shadow(0 2px 6px rgba(11, 45, 110, 0.4)); }
`;

const Tooltip = styled.div`
  position: fixed;
  z-index: 50;
  pointer-events: none;
  background: ${(p) => p.theme.cores.primaryDark};
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  strong { display: block; font-size: 13px; margin-bottom: 2px; }
`;

const Carregando = styled.div`
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.theme.cores.primaryDark};
  font-size: 13px;
  font-weight: 600;
`;

export function MapaAlagoas() {
  const t = useTheme();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tt, setTt] = useState<{ x: number; y: number; nome: string; total: number | null } | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch("/alagoas-municipios.geojson")
      .then((r) => r.json())
      .then((g: { features?: Feature[] }) => { if (ativo) setFeatures((g.features ?? []).filter((f) => f.geometry)); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  const W = 900, H = 680;
  const paths = useMemo(() => {
    if (!features.length) return [];
    const project = criarProjecao(features, W, H, 24);
    return features.map((f) => {
      const nome = f.properties.name ?? f.properties.nome ?? "Município";
      const d = dadoPorMun.get(norm(nome));
      return { nome, total: d ? d.total : null, d: geometriaParaPath(f.geometry, project), fill: d ? corPorValor(d.total, maxTotal) : t.cores.accentSoft };
    });
  }, [features, t.cores.accentSoft]);

  if (!features.length) return <Carregando>Carregando mapa de Alagoas…</Carregando>;

  return (
    <Wrap>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Mapa de Alagoas por município">
        {paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            fill={p.fill}
            onMouseMove={(e) => setTt({ x: e.clientX, y: e.clientY, nome: p.nome, total: p.total })}
            onMouseLeave={() => setTt(null)}
          />
        ))}
      </svg>
      {tt && (
        <Tooltip style={{ left: tt.x + 14, top: tt.y - 10 }}>
          <strong>{tt.nome}</strong>
          {tt.total !== null ? `${tt.total.toLocaleString("pt-BR")} beneficiários` : "Sem dados na demonstração"}
        </Tooltip>
      )}
    </Wrap>
  );
}
