import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LogOut, ChevronUp } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";
import { Tag } from "../../Styles/ui.js";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

const Wrap = styled.div`
  position: relative;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 860px) {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    padding-left: 12px;
    flex-shrink: 0;
  }
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  text-align: left;
  color: ${(p) => p.theme.cores.sidebarText};
  transition: background 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); }
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Papel = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.cores.sidebarMuted};
`;

const Seta = styled(ChevronUp)<{ $aberto: boolean }>`
  flex-shrink: 0;
  color: ${(p) => p.theme.cores.sidebarMuted};
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$aberto ? "0deg" : "180deg")});
  @media (max-width: 640px) { display: none; }
`;

const Menu = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 12px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 8px;
  z-index: 60;

  @media (min-width: 861px) {
    top: auto;
    bottom: calc(100% + 8px);
  }
`;

const Cabecalho = styled.div`
  padding: 8px 10px 10px;
  border-bottom: 1px solid ${(p) => p.theme.cores.border};
  margin-bottom: 6px;
`;

const CabNome = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.text};
`;

const CabEmail = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
  margin: 2px 0 8px;
  word-break: break-all;
`;

const Opcao = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.danger};
  transition: background 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.surfaceAlt}; }
`;

export function UsuarioMenu() {
  const { usuario, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", onClickFora);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickFora);
      document.removeEventListener("keydown", onEsc);
    };
  }, [aberto]);

  if (!usuario) return null;

  return (
    <Wrap ref={ref}>
      <Trigger type="button" onClick={() => setAberto((v) => !v)} aria-haspopup="menu" aria-expanded={aberto}>
        <Bolinha>{usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}</Bolinha>
        <Info>
          <Nome>{usuario.nome}</Nome>
          <Papel>{usuario.papel}</Papel>
        </Info>
        <Seta size={16} $aberto={aberto} />
      </Trigger>

      {aberto && (
        <Menu role="menu">
          <Cabecalho>
            <CabNome>{usuario.nome}</CabNome>
            <CabEmail>{usuario.email}</CabEmail>
            <Tag $tone="blue">{usuario.papel}</Tag>
          </Cabecalho>
          <Opcao type="button" role="menuitem" onClick={sair}>
            <LogOut size={16} />
            Sair
          </Opcao>
        </Menu>
      )}
    </Wrap>
  );
}
