import { useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
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
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Usuários</PageTitle>
          <PageSubtitle>Gerencie o acesso da equipe</PageSubtitle>
        </div>
        <Button onClick={() => navigate("/usuarios/novo")}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </PageHeader>

      <EmptyState>
        <EmptyIcon><Users size={30} /></EmptyIcon>
        <SectionTitle>Gestão de usuários</SectionTitle>
        <Muted>
          Papéis disponíveis: Administrador, Gestor (PO), Coletador e Visualizador. Cadastre membros
          da equipe e defina o acesso de cada um.
        </Muted>
        <Button onClick={() => navigate("/usuarios/novo")} style={{ marginTop: 18 }}>
          <Plus size={16} />
          Cadastrar usuário
        </Button>
      </EmptyState>
    </div>
  );
}
