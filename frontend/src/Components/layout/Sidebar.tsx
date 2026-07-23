import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { LayoutDashboard, ClipboardList, Users, ScrollText, type LucideIcon } from "lucide-react";
import { Logo } from "../ui/Logo.js";
import { useAuth } from "../../App/auth/useAuth.js";

interface ItemNav {
  to: string;
  rotulo: string;
  Icon: LucideIcon;
}

const NAV: { grupo: string; itens: ItemNav[] }[] = [
  {
    grupo: "Principal",
    itens: [
      { to: "/", rotulo: "Dashboard", Icon: LayoutDashboard },
      { to: "/pesquisas", rotulo: "Pesquisas", Icon: ClipboardList },
    ],
  },
  {
    grupo: "Administração",
    itens: [
      { to: "/usuarios", rotulo: "Usuários", Icon: Users },
      { to: "/logs", rotulo: "Auditoria", Icon: ScrollText },
    ],
  },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

const Aside = styled.nav`
  background: ${(p) => p.theme.cores.sidebar};
  color: ${(p) => p.theme.cores.sidebarText};
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 14px;

  @media (max-width: 860px) {
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    overflow-x: auto;
  }
`;

const Marca = styled.div`
  padding: 0 8px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;

  @media (max-width: 860px) {
    padding: 0 12px 0 4px;
    margin-bottom: 0;
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }
`;

const Grupos = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 860px) {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
`;

const Grupo = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: ${(p) => p.theme.cores.sidebarMuted};
  padding: 14px 10px 6px;

  @media (max-width: 860px) {
    display: none;
  }
`;

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 10px;
  color: ${(p) => p.theme.cores.sidebarMuted};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); color: ${(p) => p.theme.cores.sidebarText}; }
  &.active { background: ${(p) => p.theme.cores.sidebarActive}; color: #fff; font-weight: 600; }
`;

const Rodape = styled.div`
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 860px) {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    padding-left: 12px;
    flex-shrink: 0;
  }
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
  background: ${(p) => p.theme.cores.accent};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  flex: 1;
  @media (max-width: 640px) { display: none; }
`;

const Nome = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.sidebarText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Papel = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.cores.sidebarMuted};
`;

const Sair = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.sidebarMuted};
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  &:hover { color: #fff; }
`;

export function Sidebar() {
  const { usuario, sair } = useAuth();

  return (
    <Aside aria-label="navegação principal">
      <Marca>
        <Logo variante="branca" altura={30} />
      </Marca>
      <Grupos>
        {NAV.map((g) => (
          <div key={g.grupo} style={{ display: "contents" }}>
            <Grupo>{g.grupo}</Grupo>
            {g.itens.map(({ to, rotulo, Icon }) => (
              <Item key={to} to={to} end={to === "/"}>
                <Icon size={18} />
                {rotulo}
              </Item>
            ))}
          </div>
        ))}
      </Grupos>
      {usuario && (
        <Rodape>
          <Bolinha>{usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}</Bolinha>
          <Info>
            <Nome>{usuario.nome}</Nome>
            <Papel>{usuario.papel}</Papel>
          </Info>
          <Sair type="button" onClick={sair}>Sair</Sair>
        </Rodape>
      )}
    </Aside>
  );
}
