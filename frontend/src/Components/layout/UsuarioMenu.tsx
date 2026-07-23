import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LogOut } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";
import { Tag } from "../../Styles/ui.js";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

const Avatar = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${(p) => p.theme.cores.primary};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  transition: filter 0.15s ease;
  &:hover { filter: brightness(1.08); }
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Menu = styled.div`
  position: fixed;
  z-index: 1000;
  min-width: 240px;
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 240;
    setPos({ top: r.bottom + 8, left: Math.max(8, r.right - width), width });
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    function onClickFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (triggerRef.current?.contains(alvo) || menuRef.current?.contains(alvo)) return;
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
    <>
      <Avatar
        ref={triggerRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title={usuario.nome}
      >
        {usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}
      </Avatar>

      {aberto &&
        pos &&
        createPortal(
          <Menu ref={menuRef} role="menu" style={{ top: pos.top, left: pos.left, width: pos.width }}>
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
    </>
  );
}
