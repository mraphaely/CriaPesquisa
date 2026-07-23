import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle.js";
import { useAuth } from "../../App/auth/useAuth.js";
import { Button, Tag } from "../../Styles/ui.js";

const TITULOS: Record<string, string> = {
  "/": "Visão geral",
  "/pesquisas": "Pesquisas",
  "/usuarios": "Usuários",
  "/logs": "Auditoria",
};

const Bar = styled.header`
  height: 60px;
  background: ${(p) => p.theme.cores.surface};
  border-bottom: 1px solid ${(p) => p.theme.cores.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 20;
`;

const Titulo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.primaryDark};
`;

const Dir = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Usuario = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(p) => p.theme.cores.text};
  @media (max-width: 640px) { span { display: none; } }
`;

export function Topbar() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const titulo = TITULOS[pathname] ?? "CriaPesquisa";

  return (
    <Bar>
      <Titulo>{titulo}</Titulo>
      <Dir>
        <ThemeToggle />
        {usuario && (
          <Usuario>
            <span>{usuario.nome}</span>
            <Tag $tone="blue">{usuario.papel}</Tag>
          </Usuario>
        )}
        <Button type="button" $variant="ghost" onClick={sair}>
          Sair
        </Button>
      </Dir>
    </Bar>
  );
}
