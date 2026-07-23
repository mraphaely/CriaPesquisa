import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle.js";
import { useAuth } from "../../App/auth/useAuth.js";

const TITULOS: Record<string, string> = {
  "/": "Visão geral",
  "/pesquisas": "Pesquisas",
  "/usuarios": "Usuários",
  "/logs": "Auditoria",
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

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

const Dir = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Usuario = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Bolinha = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${(p) => p.theme.cores.primary};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  @media (max-width: 640px) {
    display: none;
  }
`;

const Nome = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.text};
`;

const Papel = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
`;

const Sair = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.textMuted};
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  &:hover {
    color: ${(p) => p.theme.cores.danger};
  }
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
          <>
            <Usuario>
              <Bolinha>
                {usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}
              </Bolinha>
              <Info>
                <Nome>{usuario.nome}</Nome>
                <Papel>{usuario.papel}</Papel>
              </Info>
            </Usuario>
            <Sair type="button" onClick={sair}>
              Sair
            </Sair>
          </>
        )}
      </Dir>
    </Bar>
  );
}
