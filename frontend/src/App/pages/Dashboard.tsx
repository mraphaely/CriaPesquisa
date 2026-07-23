import { useNavigate } from "react-router-dom";
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
  Muted,
  Banner,
  Button,
} from "../../Styles/ui.js";

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>Visão geral das pesquisas do Cartão CRIA</PageSubtitle>
        </div>
        <Button onClick={() => navigate("/pesquisas")}>+ Nova pesquisa</Button>
      </PageHeader>

      <Banner $tone="info" style={{ marginBottom: 22 }}>
        🔌 Modo demonstração — conecte o backend + PostgreSQL para ver os dados reais das pesquisas.
      </Banner>

      <KpiRow>
        <KpiCard>
          <KpiIcon>🗂️</KpiIcon>
          <KpiValue>—</KpiValue>
          <KpiLabel>Pesquisas ativas</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIcon>🧾</KpiIcon>
          <KpiValue>—</KpiValue>
          <KpiLabel>Respostas coletadas</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIcon>👥</KpiIcon>
          <KpiValue>—</KpiValue>
          <KpiLabel>Coletadores</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIcon>🏙️</KpiIcon>
          <KpiValue>102</KpiValue>
          <KpiLabel>Municípios de Alagoas</KpiLabel>
        </KpiCard>
      </KpiRow>

      <Card>
        <SectionTitle>Bem-vinda ao CriaPesquisa</SectionTitle>
        <Muted>
          Aqui você cria e gerencia pesquisas, monta formulários com vários tipos de pergunta,
          coleta respostas, acompanha resultados com filtros e exporta para Excel/CSV. O Cartão CRIA é
          a pesquisa-carro-chefe, com dashboard próprio (mapa de Alagoas, KPIs e indicadores) alimentado
          pelas respostas reais.
        </Muted>
      </Card>
    </div>
  );
}
