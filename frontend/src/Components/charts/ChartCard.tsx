import { useState, type ReactNode } from "react";
import styled from "styled-components";
import { BarChart3, Filter } from "lucide-react";
import { Card, SectionTitle } from "../../Styles/ui.js";
import { FunilValores, type ValorGrafico } from "./FunilValores.js";

export type { ValorGrafico };

const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
`;

const Alternar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surfaceAlt};
  color: ${(p) => p.theme.cores.text};
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
  &:hover {
    background: ${(p) => p.theme.cores.accentSoft};
    border-color: ${(p) => p.theme.cores.accent};
  }
`;

export function ChartCard({
  titulo,
  altura = 240,
  valores,
  children,
}: {
  titulo: string;
  altura?: number;
  valores?: ValorGrafico[];
  children: ReactNode;
}) {
  const [mostrarValores, setMostrarValores] = useState(false);
  const podeAlternar = Boolean(valores && valores.length > 0);

  return (
    <Card>
      <Cabecalho>
        <SectionTitle style={{ margin: 0 }}>{titulo}</SectionTitle>
        {podeAlternar && (
          <Alternar
            type="button"
            onClick={() => setMostrarValores((v) => !v)}
            aria-pressed={mostrarValores}
            title={mostrarValores ? "Ver gráfico" : "Mostrar valores"}
          >
            {mostrarValores ? <BarChart3 size={13} /> : <Filter size={13} />}
            {mostrarValores ? "Ver gráfico" : "Mostrar valores"}
          </Alternar>
        )}
      </Cabecalho>

      {podeAlternar && mostrarValores ? (
        <FunilValores valores={valores!} />
      ) : (
        <div style={{ height: altura, position: "relative" }}>{children}</div>
      )}
    </Card>
  );
}
