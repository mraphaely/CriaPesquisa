import { useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Bar, Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { Plus, Users, Baby, HeartPulse, MapPin, Wallet } from "lucide-react";
import "../../Components/charts/setup.js";
import { ChartCard } from "../../Components/charts/ChartCard.js";
import { DonutInterativo } from "../../Components/charts/DonutInterativo.js";
import { MapaAlagoas } from "../../Components/mapa/MapaAlagoas.js";
import { usePainel } from "../api/painel.js";
import { usePesquisas } from "../api/pesquisas.js";
import { useAuth } from "../auth/useAuth.js";
import { podeGerenciarPesquisas } from "../auth/permissoes.js";
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
  Muted,
  Select,
} from "../../Styles/ui.js";

const Grade = styled.div`
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const GradeMapa = styled.div`
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
  grid-template-columns: 1.6fr 1fr;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SeletorResultados = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  label {
    font-size: 12.5px;
    font-weight: 600;
    color: ${(p) => p.theme.cores.textMuted};
  }
`;

const Legenda = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
`;

const Escala = styled.div`
  flex: 1;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(90deg, #d9ecff, #78bbff, #3a8ef0, #1756b8, #0b2d6e);
`;

function fmtMil(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "K" : n.toLocaleString("pt-BR");
}

export function Dashboard() {
  const navigate = useNavigate();
  const t = useTheme();
  const { usuario } = useAuth();
  const podeCriar = podeGerenciarPesquisas(usuario?.papel);
  const { data, isLoading, isError } = usePainel();
  const { data: listaPesquisas } = usePesquisas();

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
  const cabecalho = (
    <PageHeader>
      <div>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>Visão geral · Cartão CRIA — Primeira Infância de Alagoas</PageSubtitle>
      </div>
      {podeCriar && (
        <Button onClick={() => navigate("/pesquisas/nova")}>
          <Plus size={16} />
          Nova pesquisa
        </Button>
      )}
    </PageHeader>
  );

  if (isLoading || !data) {
    return (
      <div>
        {cabecalho}
        <Card>
          <Muted style={{ textAlign: "center", padding: "28px 0" }}>Carregando painel…</Muted>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        {cabecalho}
        <Banner $tone="warn">
          Não foi possível carregar o painel. Verifique se o servidor está no ar e tente novamente.
        </Banner>
      </div>
    );
  }

  const { totais, municipios, investimento, beneficios, distribuicoes, pesquisas, respostas, periodo } = data;
  const periodoLabel = periodo ? `${periodo.mesNome}/${periodo.ano}` : "—";

  return (
    <div>
      {cabecalho}

      {listaPesquisas && listaPesquisas.itens.length > 0 && (
        <SeletorResultados>
          <label htmlFor="sel-resultados">Resultados por pesquisa:</label>
          <Select
            id="sel-resultados"
            value=""
            onChange={(e) => e.target.value && navigate(`/pesquisas/${e.target.value}`)}
            style={{ maxWidth: 360 }}
          >
            <option value="">Selecione uma pesquisa…</option>
            {listaPesquisas.itens.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </Select>
        </SeletorResultados>
      )}

      <Muted style={{ display: "block", marginBottom: 22, fontSize: 12.5 }}>
        Referência {periodoLabel} · {respostas.total} resposta(s) aprovada(s)
        {respostas.pendentes > 0 ? ` · ${respostas.pendentes} pendente(s) de revisão` : ""} ·{" "}
        {pesquisas.publicadas} de {pesquisas.total} pesquisa(s) publicada(s)
      </Muted>

      <KpiRow>
        <KpiCard $cor="#1756B8"><KpiIcon $cor="#1756B8"><Users size={20} /></KpiIcon><KpiValue>{fmtMil(totais.totalBeneficiarios)}</KpiValue><KpiLabel>Beneficiários</KpiLabel></KpiCard>
        <KpiCard $cor="#16A34A"><KpiIcon $cor="#16A34A"><Baby size={20} /></KpiIcon><KpiValue>{fmtMil(totais.criancas)}</KpiValue><KpiLabel>Crianças</KpiLabel></KpiCard>
        <KpiCard $cor="#EA580C"><KpiIcon $cor="#EA580C"><HeartPulse size={20} /></KpiIcon><KpiValue>{fmtMil(totais.gestantes)}</KpiValue><KpiLabel>Gestantes</KpiLabel></KpiCard>
        <KpiCard $cor="#7C3AED"><KpiIcon $cor="#7C3AED"><MapPin size={20} /></KpiIcon><KpiValue>{totais.municipios}</KpiValue><KpiLabel>Municípios</KpiLabel></KpiCard>
        <KpiCard $cor="#0EA5E9"><KpiIcon $cor="#0EA5E9"><Wallet size={20} /></KpiIcon><KpiValue>R${(totais.investimentoMensal / 1e6).toFixed(1).replace(".", ",")}Mi</KpiValue><KpiLabel>Investimento/mês</KpiLabel></KpiCard>
      </KpiRow>

      <GradeMapa>
        <Card>
          <SectionTitle>Beneficiários por município</SectionTitle>
          <MapaAlagoas dados={municipios} />
          <Legenda>
            <span>Menos</span>
            <Escala />
            <span>Mais</span>
          </Legenda>
        </Card>
        <Card>
          <SectionTitle>Top municípios</SectionTitle>
          <TableWrap>
            <Tabela>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Município</Th>
                  <Th>Benef.</Th>
                </tr>
              </thead>
              <tbody>
                {municipios.slice(0, 10).map((m, i) => (
                  <tr key={m.municipio}>
                    <Td><Tag $tone="muted">{i + 1}</Tag></Td>
                    <Td style={{ fontWeight: 600 }}>{m.municipio}</Td>
                    <Td>{m.total.toLocaleString("pt-BR")}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </TableWrap>
          <Muted style={{ marginTop: 12, fontSize: 12 }}>Passe o mouse no mapa para ver cada município.</Muted>
        </Card>
      </GradeMapa>

      <Grade>
        <DonutInterativo
          titulo="Distribuição racial"
          unidade="respostas"
          labels={distribuicoes.raca.labels}
          data={distribuicoes.raca.data}
        />
        <DonutInterativo
          titulo="Zona (urbana × rural)"
          unidade="respostas"
          labels={distribuicoes.zona.labels}
          data={distribuicoes.zona.data}
          cores={[t.cores.primary, t.cores.primaryDark]}
        />
        <ChartCard
          titulo="Composição do benefício"
          valores={beneficios.map((b) => ({ rotulo: b.label, valor: b.quantidade.toLocaleString("pt-BR"), barra: b.quantidade }))}
        >
          {beneficios.length ? (
            <Bar
              data={{ labels: beneficios.map((b) => b.label), datasets: [{ label: "Famílias", data: beneficios.map((b) => b.quantidade), backgroundColor: t.cores.primary, borderRadius: 6 }] }}
              options={optBar}
            />
          ) : (
            <SemDados />
          )}
        </ChartCard>
      </Grade>

      <ChartCard
        titulo="Evolução do investimento (R$ milhões/mês)"
        altura={220}
        valores={investimento.labels.map((l, i) => ({ rotulo: l, valor: `R$ ${investimento.data[i]} Mi`, barra: investimento.data[i] }))}
      >
        {investimento.data.length ? (
          <Line
            data={{ labels: investimento.labels, datasets: [{ label: "Investimento", data: investimento.data, borderColor: t.cores.primary, backgroundColor: t.cores.accentSoft, fill: true, tension: 0.4, pointRadius: 2 }] }}
            options={optLine}
          />
        ) : (
          <SemDados />
        )}
      </ChartCard>
    </div>
  );
}

function SemDados() {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
      <Muted style={{ fontSize: 12.5 }}>Sem dados suficientes ainda.</Muted>
    </div>
  );
}
