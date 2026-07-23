import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";

const PAPEL_LABEL: Record<string, string> = {
  ADMIN: "Super Admin",
  GESTOR: "Gestor (PO)",
  COLETADOR: "Coletador",
  VISUALIZADOR: "Visualizador",
};

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
  width: 250px;
  max-width: calc(100vw - 16px);
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 14px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 12px;
`;

const Perfil = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const Big = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${(p) => p.theme.cores.primaryDark};
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Info = styled.div`
  min-width: 0;
`;

const Nome = styled.div`
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Email = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(124, 58, 237, 0.14);
  color: #7c3aed;
`;

const Divisor = styled.div`
  height: 1px;
  background: ${(p) => p.theme.cores.border};
  margin: 12px 0 8px;
`;

const Opcao = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.text};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.danger}18; color: ${(p) => p.theme.cores.danger}; }
`;

export function UsuarioAvatar() {
  const { usuario, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 250;
    setPos({ top: r.bottom + 8, left: Math.max(8, r.right - width) });
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
          <Menu ref={menuRef} role="menu" style={{ top: pos.top, left: pos.left }}>
            <Perfil>
              <Big>{usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}</Big>
              <Info>
                <Nome title={usuario.nome}>{usuario.nome}</Nome>
                <Email title={usuario.email}>{usuario.email}</Email>
              </Info>
            </Perfil>
            <Badge>
              <ShieldCheck size={13} />
              {PAPEL_LABEL[usuario.papel] ?? usuario.papel}
            </Badge>
            <Divisor />
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
