import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";
import type { Usuario } from "../../App/auth/AuthContext.js";

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

const CardBox = styled.div`
  width: 100%;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 14px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 12px;
  color: ${(p) => p.theme.cores.text};
`;

const Perfil = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const Avatar = styled.div`
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
  color: ${(p) => p.theme.cores.text};
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

const SairBtn = styled.button`
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

function CartaoPerfil({ usuario, sair }: { usuario: Usuario; sair: () => void }) {
  return (
    <CardBox>
      <Perfil>
        <Avatar>{usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}</Avatar>
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
      <SairBtn type="button" onClick={sair}>
        <LogOut size={16} />
        Sair
      </SairBtn>
    </CardBox>
  );
}

/* ── wrappers responsivos ─────────────────────────────────── */
const CardWrap = styled.div<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

const AvatarWrap = styled.div<{ $colapsada: boolean }>`
  display: ${(p) => (p.$colapsada ? "flex" : "none")};
  justify-content: center;
  @media (max-width: 860px) { display: flex; }
`;

const AvatarBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${(p) => p.theme.cores.accent};
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  transition: filter 0.15s ease;
  &:hover { filter: brightness(1.08); }
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Popover = styled.div`
  position: fixed;
  z-index: 1000;
  width: 250px;
  max-width: calc(100vw - 16px);
`;

export function UsuarioCard({ colapsada }: { colapsada: boolean }) {
  const { usuario, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 250;
    const noTopo = r.top < window.innerHeight / 2; // mobile (barra no topo)
    if (noTopo) {
      setPos({ top: r.bottom + 8, left: Math.max(8, r.right - width) });
    } else {
      // rail à esquerda: abre à direita, alinhado pela base
      setPos({ bottom: window.innerHeight - r.bottom, left: r.right + 10 });
    }
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    function onClickFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (triggerRef.current?.contains(alvo) || popRef.current?.contains(alvo)) return;
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
      <CardWrap $colapsada={colapsada}>
        <CartaoPerfil usuario={usuario} sair={sair} />
      </CardWrap>

      <AvatarWrap $colapsada={colapsada}>
        <AvatarBtn
          ref={triggerRef}
          type="button"
          onClick={() => (aberto ? setAberto(false) : abrir())}
          aria-haspopup="menu"
          aria-expanded={aberto}
          title={usuario.nome}
        >
          {usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : iniciais(usuario.nome)}
        </AvatarBtn>
      </AvatarWrap>

      {aberto &&
        pos &&
        createPortal(
          <Popover ref={popRef} style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}>
            <CartaoPerfil usuario={usuario} sair={sair} />
          </Popover>,
          document.body,
        )}
    </>
  );
}
