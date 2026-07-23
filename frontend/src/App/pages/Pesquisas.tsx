import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Button,
  EmptyState,
  EmptyIcon,
  SectionTitle,
  Muted,
} from "../../Styles/ui.js";

export function Pesquisas() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Pesquisas</PageTitle>
          <PageSubtitle>Crie, publique e acompanhe suas pesquisas</PageSubtitle>
        </div>
        <Button onClick={() => navigate("/pesquisas/nova")}>
          <Plus size={16} />
          Nova pesquisa
        </Button>
      </PageHeader>

      <EmptyState>
        <EmptyIcon><ClipboardList size={30} /></EmptyIcon>
        <SectionTitle>Nenhuma pesquisa ainda</SectionTitle>
        <Muted>
          Crie sua primeira pesquisa. O construtor permite perguntas de vários tipos (texto, número,
          data, múltipla escolha, escolha única e campo aberto), publicação e coleta de respostas.
        </Muted>
        <Button onClick={() => navigate("/pesquisas/nova")} style={{ marginTop: 18 }}>
          <Plus size={16} />
          Criar primeira pesquisa
        </Button>
      </EmptyState>
    </div>
  );
}
