import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  EmptyState,
  EmptyIcon,
  SectionTitle,
  Muted,
} from "../../Styles/ui.js";

export function Logs() {
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Auditoria</PageTitle>
          <PageSubtitle>Trilha de alterações do sistema</PageSubtitle>
        </div>
      </PageHeader>

      <EmptyState>
        <EmptyIcon>🧾</EmptyIcon>
        <SectionTitle>Log de alterações</SectionTitle>
        <Muted>
          Toda criação, edição, exclusão, publicação e restauração fica registrada (quem, quando,
          antes/depois). Conecte o backend para visualizar a trilha completa.
        </Muted>
      </EmptyState>
    </div>
  );
}
