import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { LayoutDashboard, ClipboardList, Users, ScrollText, HelpCircle, type LucideIcon } from "lucide-react";
import { Logo } from "../ui/Logo.js";

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

const Aside = styled.nav<{ $colapsada: boolean }>`
  background: ${(p) => p.theme.cores.sidebar};
  color: ${(p) => p.theme.cores.sidebarText};
  width: ${(p) => (p.$colapsada ? "84px" : "240px")};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  transition: width 0.18s ease;

  @media (max-width: 860px) {
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
  }
`;

const Topo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 8px;

  @media (max-width: 860px) {
    flex-direction: row;
    padding-bottom: 0;
    margin-bottom: 0;
    padding-right: 12px;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }
`;

const Linha = styled.div`
  width: 34px;
  height: 3px;
  border-radius: 2px;
  background: ${(p) => p.theme.cores.accent};
  @media (max-width: 860px) { display: none; }
`;

const Grupos = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  @media (max-width: 860px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
`;

const Grupo = styled.div<{ $colapsada: boolean }>`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: ${(p) => p.theme.cores.sidebarMuted};
  padding: 14px 10px 6px;
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

const linkBase = `
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
`;

const Item = styled(NavLink)<{ $colapsada: boolean }>`
  ${linkBase}
  color: ${(p) => p.theme.cores.sidebarMuted};
  justify-content: ${(p) => (p.$colapsada ? "center" : "flex-start")};
  &:hover { background: rgba(255, 255, 255, 0.08); color: ${(p) => p.theme.cores.sidebarText}; }
  &.active {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-weight: 600;
    box-shadow: inset 3px 0 0 ${(p) => p.theme.cores.accent};
  }
  @media (max-width: 860px) { justify-content: center; }
`;

const Rotulo = styled.span<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

const Rodape = styled.div<{ $colapsada: boolean }>`
  margin-top: auto;
  padding-top: 10px;
  @media (max-width: 860px) {
    margin-top: 0;
    padding-top: 0;
    padding-left: 12px;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }
`;

const Ajuda = styled.button<{ $colapsada: boolean }>`
  ${linkBase}
  width: 100%;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.cores.sidebarMuted};
  justify-content: ${(p) => (p.$colapsada ? "center" : "flex-start")};
  &:hover { background: rgba(255, 255, 255, 0.08); color: ${(p) => p.theme.cores.sidebarText}; }
  @media (max-width: 860px) { justify-content: center; width: auto; }
`;

export function Sidebar({ colapsada }: { colapsada: boolean }) {
  return (
    <Aside aria-label="navegação principal" $colapsada={colapsada}>
      <Topo>
        <Logo variante="branca" altura={colapsada ? 22 : 28} />
        <Linha />
      </Topo>
      <Grupos>
        {NAV.map((g) => (
          <div key={g.grupo} style={{ display: "contents" }}>
            <Grupo $colapsada={colapsada}>{g.grupo}</Grupo>
            {g.itens.map(({ to, rotulo, Icon }) => (
              <Item key={to} to={to} end={to === "/"} $colapsada={colapsada} title={rotulo}>
                <Icon size={19} />
                <Rotulo $colapsada={colapsada}>{rotulo}</Rotulo>
              </Item>
            ))}
          </div>
        ))}
      </Grupos>
      <Rodape $colapsada={colapsada}>
        <Ajuda type="button" $colapsada={colapsada} title="Ajuda">
          <HelpCircle size={19} />
          <Rotulo $colapsada={colapsada}>Ajuda</Rotulo>
        </Ajuda>
      </Rodape>
    </Aside>
  );
}
