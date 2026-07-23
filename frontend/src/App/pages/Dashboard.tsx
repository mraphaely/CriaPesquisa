import { useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { Plus, Users, Baby, HeartPulse, MapPin, Wallet } from "lucide-react";
import "../../Components/charts/setup.js";
import { ChartCard } from "../../Components/charts/ChartCard.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  KpiRow,
  KpiCard,
  KpiIcon,
  KpiValue,
  KpiLabel,
  Card,
  SectionTitle,
  Banner,
  Button,
  TableWrap,
  Tabela,
  Th,
  Td,
  Tag,
} from "../../Styles/ui.js";
import { MUNICIPIOS, TOTAIS, RACA, ZONA, FAIXA_ETARIA, INVESTIMENTO, PALETA } from "../data/cria.js";

const Grade = styled.div`
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

function fmtMil(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "K" : n.toLocaleString("pt-BR");
}

export function Dashboard() {
  const navigate = useNavigate();
  const t = useTheme();
  const ticks = { color: t.cores.textMuted, font: { size: 10 } };
  const grid = { color: t.cores.border };

  const optBar: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks, grid: { display: false } }, y: { ticks, grid } },
  };
  const optLine: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { ...ticks, maxTicksLimit: 8 }, grid: { display: false } }, y: { ticks, grid } },
  };
  const optDoughnut: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "66%",
    plugins: { legend: { position: "right", labels: { color: t.cores.textMuted, font: { size: 11 }, boxWidth: 12 } } },
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>Visão geral · Cartão CRIA — Primeira Infância de Alagoas</PageSubtitle>
        </div>
        <Button onClick={() => navigate("/pesquisas")}>
          <Plus size={16} />
          Nova pesquisa
        </Button>
      </PageHeader>

      <Banner $tone="info" style={{ marginBottom: 22 }}>
        Modo demonstração — dados ilustrativos. Conecte o backend + PostgreSQL para os dados reais das pesquisas.
      </Banner>

      <KpiRow>
        <KpiCard><KpiIcon><Users size={20} /></KpiIcon><KpiValue>{fmtMil(TOTAIS.totalBeneficiarios)}</KpiValue><KpiLabel>Beneficiários</KpiLabel></KpiCard>
        <KpiCard><KpiIcon><Baby size={20} /></KpiIcon><KpiValue>{fmtMil(TOTAIS.criancas)}</KpiValue><KpiLabel>Crianças</KpiLabel></KpiCard>
        <KpiCard><KpiIcon><HeartPulse size={20} /></KpiIcon><KpiValue>{fmtMil(TOTAIS.gestantes)}</KpiValue><KpiLabel>Gestantes</KpiLabel></KpiCard>
        <KpiCard><KpiIcon><MapPin size={20} /></KpiIcon><KpiValue>{TOTAIS.municipios}</KpiValue><KpiLabel>Municípios</KpiLabel></KpiCard>
        <KpiCard><KpiIcon><Wallet size={20} /></KpiIcon><KpiValue>R${(TOTAIS.investimentoMensal / 1e6).toFixed(1).replace(".", ",")}Mi</KpiValue><KpiLabel>Investimento/mês</KpiLabel></KpiCard>
      </KpiRow>

      <Grade>
        <ChartCard titulo="Distribuição racial">
          <Doughnut
            data={{ labels: RACA.labels, datasets: [{ data: RACA.data, backgroundColor: PALETA, borderWidth: 2, borderColor: t.cores.surface }] }}
            options={optDoughnut}
          />
        </ChartCard>
        <ChartCard titulo="Zona (urbana × rural)">
          <Doughnut
            data={{ labels: ZONA.labels, datasets: [{ data: ZONA.data, backgroundColor: [t.cores.primary, t.cores.primaryDark], borderWidth: 2, borderColor: t.cores.surface }] }}
            options={optDoughnut}
          />
        </ChartCard>
        <ChartCard titulo="Faixa etária (crianças)">
          <Bar
            data={{ labels: FAIXA_ETARIA.labels, datasets: [{ label: "Crianças", data: FAIXA_ETARIA.criancas, backgroundColor: t.cores.primary, borderRadius: 6 }] }}
            options={optBar}
          />
        </ChartCard>
      </Grade>

      <div style={{ marginBottom: 16 }}>
        <ChartCard titulo="Evolução do investimento (R$ milhões/mês)" altura={220}>
          <Line
            data={{ labels: INVESTIMENTO.labels, datasets: [{ label: "Investimento", data: INVESTIMENTO.data, borderColor: t.cores.primary, backgroundColor: t.cores.accentSoft, fill: true, tension: 0.4, pointRadius: 2 }] }}
            options={optLine}
          />
        </ChartCard>
      </div>

      <Card>
        <SectionTitle>Top municípios por beneficiários</SectionTitle>
        <TableWrap>
          <Tabela>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Município</Th>
                <Th>Beneficiários</Th>
                <Th>Crianças</Th>
                <Th>Gestantes</Th>
              </tr>
            </thead>
            <tbody>
              {MUNICIPIOS.slice(0, 10).map((m, i) => (
                <tr key={m.municipio}>
                  <Td><Tag $tone="muted">{i + 1}</Tag></Td>
                  <Td style={{ fontWeight: 600 }}>{m.municipio}</Td>
                  <Td>{m.total.toLocaleString("pt-BR")}</Td>
                  <Td>{m.criancas.toLocaleString("pt-BR")}</Td>
                  <Td>{m.gestantes.toLocaleString("pt-BR")}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </TableWrap>
      </Card>
    </div>
  );
}
