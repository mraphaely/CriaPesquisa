import { ClipboardList } from "lucide-react";
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
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Pesquisas</PageTitle>
          <PageSubtitle>Crie, publique e acompanhe suas pesquisas</PageSubtitle>
        </div>
        <Button>+ Nova pesquisa</Button>
      </PageHeader>

      <EmptyState>
        <EmptyIcon><ClipboardList size={30} /></EmptyIcon>
        <SectionTitle>Nenhuma pesquisa ainda</SectionTitle>
        <Muted>
          Conecte o backend e crie sua primeira pesquisa. O construtor permite seções, perguntas de
          vários tipos (texto, número, data, múltipla escolha, escolha única e campo aberto),
          publicação e coleta de respostas.
        </Muted>
      </EmptyState>
    </div>
  );
}
