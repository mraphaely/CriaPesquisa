import { useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { LayoutDashboard, ClipboardList, Users, ScrollText, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { Logo } from "../ui/Logo.js";
import { UsuarioMenu } from "./UsuarioMenu.js";

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

const Topo = styled.div<{ $colapsada: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.$colapsada ? "column" : "row")};
  align-items: center;
  justify-content: ${(p) => (p.$colapsada ? "center" : "space-between")};
  gap: 10px;
  padding: 0 6px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;

  @media (max-width: 860px) {
    padding: 0 10px 0 4px;
    margin-bottom: 0;
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }
`;

const MarcaBox = styled.div`
  display: flex;
  align-items: center;
`;

const BotaoColapsar = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  color: ${(p) => p.theme.cores.sidebarMuted};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
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

const Item = styled(NavLink)<{ $colapsada: boolean }>`
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
  justify-content: ${(p) => (p.$colapsada ? "center" : "flex-start")};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); color: ${(p) => p.theme.cores.sidebarText}; }
  &.active { background: ${(p) => p.theme.cores.sidebarActive}; color: #fff; font-weight: 600; }

  @media (max-width: 860px) { justify-content: center; }
`;

const Rotulo = styled.span<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

export function Sidebar() {
  const [colapsada, setColapsada] = useState<boolean>(() => localStorage.getItem("sidebar-colapsada") === "1");

  function alternar() {
    setColapsada((v) => {
      const nova = !v;
      localStorage.setItem("sidebar-colapsada", nova ? "1" : "0");
      return nova;
    });
  }

  return (
    <Aside aria-label="navegação principal" $colapsada={colapsada}>
      <Topo $colapsada={colapsada}>
        <MarcaBox>
          <Logo variante="branca" altura={colapsada ? 22 : 28} />
        </MarcaBox>
        <BotaoColapsar
          type="button"
          onClick={alternar}
          aria-label={colapsada ? "expandir menu" : "minimizar menu"}
          title={colapsada ? "Expandir menu" : "Minimizar menu"}
        >
          {colapsada ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </BotaoColapsar>
      </Topo>
      <Grupos>
        {NAV.map((g) => (
          <div key={g.grupo} style={{ display: "contents" }}>
            <Grupo $colapsada={colapsada}>{g.grupo}</Grupo>
            {g.itens.map(({ to, rotulo, Icon }) => (
              <Item key={to} to={to} end={to === "/"} $colapsada={colapsada} title={rotulo}>
                <Icon size={18} />
                <Rotulo $colapsada={colapsada}>{rotulo}</Rotulo>
              </Item>
            ))}
          </div>
        ))}
      </Grupos>
      <UsuarioMenu colapsada={colapsada} />
    </Aside>
  );
}
