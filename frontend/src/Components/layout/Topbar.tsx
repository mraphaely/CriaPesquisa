import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle.js";

const TITULOS: Record<string, string> = {
  "/": "Visão geral",
  "/pesquisas": "Pesquisas",
  "/usuarios": "Usuários",
  "/logs": "Auditoria",
};

const Bar = styled.header`
  min-height: 60px;
  background: ${(p) => p.theme.cores.surface};
  border-bottom: 1px solid ${(p) => p.theme.cores.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 20;
  @media (max-width: 640px) {
    padding: 0 14px;
  }
`;

const Titulo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.primaryDark};
`;

export function Topbar() {
  const { pathname } = useLocation();
  const titulo = TITULOS[pathname] ?? "CriaPesquisa";

  return (
    <Bar>
      <Titulo>{titulo}</Titulo>
      <ThemeToggle />
    </Bar>
  );
}
