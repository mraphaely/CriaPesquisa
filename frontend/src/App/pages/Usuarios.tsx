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

export function Usuarios() {
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Usuários</PageTitle>
          <PageSubtitle>Gerencie o acesso da equipe</PageSubtitle>
        </div>
        <Button>+ Novo usuário</Button>
      </PageHeader>

      <EmptyState>
        <EmptyIcon>👥</EmptyIcon>
        <SectionTitle>Gestão de usuários</SectionTitle>
        <Muted>
          Papéis disponíveis: Administrador, Gestor (PO), Coletador e Visualizador. Conecte o backend
          para listar, cadastrar e desativar usuários.
        </Muted>
      </EmptyState>
    </div>
  );
}
