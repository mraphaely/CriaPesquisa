import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

interface Pos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

const Wrap = styled.div`
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
  position: fixed;
  z-index: 1000;
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 12px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 8px;
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
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const largura = Math.max(r.width, 230);
    const paraCima = r.top > window.innerHeight / 2;
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - largura - 8)),
      width: largura,
      ...(paraCima ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
    });
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    function onClickFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (triggerRef.current?.contains(alvo)) return;
      if (menuRef.current?.contains(alvo)) return;
      setAberto(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    function fechar() {
      setAberto(false);
    }
    document.addEventListener("mousedown", onClickFora);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", onClickFora);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto]);

  if (!usuario) return null;

  return (
    <Wrap>
      <Trigger
        ref={triggerRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <Bolinha>{usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}</Bolinha>
        <Info>
          <Nome>{usuario.nome}</Nome>
          <Papel>{usuario.papel}</Papel>
        </Info>
        <Seta size={16} $aberto={aberto} />
      </Trigger>

      {aberto &&
        pos &&
        createPortal(
          <Menu
            ref={menuRef}
            role="menu"
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          >
            <Cabecalho>
              <CabNome>{usuario.nome}</CabNome>
              <CabEmail>{usuario.email}</CabEmail>
              <Tag $tone="blue">{usuario.papel}</Tag>
            </Cabecalho>
            <Opcao type="button" role="menuitem" onClick={sair}>
              <LogOut size={16} />
              Sair
            </Opcao>
          </Menu>,
          document.body,
        )}
    </Wrap>
  );
}
