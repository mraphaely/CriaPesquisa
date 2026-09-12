import styled from "styled-components";

export interface ValorGrafico {
  rotulo: string;
  valor: number | string;
  /** Magnitude numérica usada para o comprimento da barra (funil). */
  barra?: number;
  /** Texto auxiliar à direita (ex.: percentual). */
  extra?: string;
}

const Funil = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 6px 2px 2px;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ItemTopo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const Rotulo = styled.span`
  font-size: 12.5px;
  color: ${(p) => p.theme.cores.text};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Numero = styled.span`
  flex-shrink: 0;
  font-weight: 700;
  font-size: 13px;
  color: ${(p) => p.theme.cores.primaryDark};
`;

const Extra = styled.span`
  color: ${(p) => p.theme.cores.textMuted};
  font-weight: 600;
  margin-left: 6px;
  font-size: 11.5px;
`;

const Track = styled.div`
  height: 10px;
  border-radius: 999px;
  background: ${(p) => p.theme.cores.surfaceAlt};
  overflow: hidden;
`;

const Fill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => Math.max(p.$pct, 3)}%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${(p) => p.theme.cores.accent}, ${(p) => p.theme.cores.primary});
  transition: width 0.4s ease;
`;

/** Lista de valores como barras proporcionais (estilo funil/ranking). */
export function FunilValores({ valores, maxBarra: maxBarraProp }: { valores: ValorGrafico[]; maxBarra?: number }) {
  const maxBarra = maxBarraProp ?? (valores.length ? Math.max(1, ...valores.map((v) => v.barra ?? 0)) : 1);
  return (
    <Funil>
      {valores.map((v) => (
        <Item key={v.rotulo}>
          <ItemTopo>
            <Rotulo title={v.rotulo}>{v.rotulo}</Rotulo>
            <Numero>
              {v.valor}
              {v.extra && <Extra>{v.extra}</Extra>}
            </Numero>
          </ItemTopo>
          <Track>
            <Fill $pct={((v.barra ?? 0) / maxBarra) * 100} />
          </Track>
        </Item>
      ))}
    </Funil>
  );
}
