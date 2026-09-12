import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Bell, ClipboardCheck, MessageSquare, Sparkles, X, CheckCheck, type LucideIcon } from "lucide-react";

interface Notif {
  id: string;
  Icon: LucideIcon;
  titulo: string;
  quando: string;
  lida: boolean;
}

// Amostra (modo demonstração). Virá da API quando o backend estiver conectado.
const ITENS: Notif[] = [
  { id: "1", Icon: ClipboardCheck, titulo: 'Pesquisa "Cartão CRIA — Criança" publicada', quando: "há 2 h", lida: false },
  { id: "2", Icon: MessageSquare, titulo: "18 novas respostas coletadas em Maceió", quando: "há 5 h", lida: false },
  { id: "3", Icon: Sparkles, titulo: "Bem-vinda ao CriaPesquisa!", quando: "ontem", lida: false },
];

const Botao = styled.button`
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surfaceAlt};
  color: ${(p) => p.theme.cores.text};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.border}; }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: ${(p) => p.theme.cores.danger};
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${(p) => p.theme.cores.surface};
`;

const Menu = styled.div`
  position: fixed;
  z-index: 1000;
  width: 320px;
  max-width: calc(100vw - 16px);
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 12px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 8px;
`;

const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 6px 10px;
  border-bottom: 1px solid ${(p) => p.theme.cores.border};
  margin-bottom: 6px;
`;

const Titulo = styled.div`
  font-size: 13px;
  font-weight: 700;
`;

const MarcarTodas = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.primary};
  transition: background 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.accentSoft}; }
`;

const Item = styled.div<{ $lida: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 34px 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  opacity: ${(p) => (p.$lida ? 0.55 : 1)};
  transition: background 0.15s ease, opacity 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.surfaceAlt}; }
`;

const ItemIcone = styled.span<{ $lida: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  background: ${(p) => (p.$lida ? p.theme.cores.surfaceAlt : p.theme.cores.accentSoft)};
  color: ${(p) => (p.$lida ? p.theme.cores.textMuted : p.theme.cores.primary)};
`;

const ItemTexto = styled.div`
  font-size: 12.5px;
  line-height: 1.35;
  min-width: 0;
`;

const TituloLinha = styled.div<{ $lida: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: ${(p) => (p.$lida ? 400 : 600)};
`;

const Ponto = styled.span`
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${(p) => p.theme.cores.primary};
`;

const Quando = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.cores.textMuted};
  margin-top: 2px;
`;

const Fechar = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${(p) => p.theme.cores.textMuted};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover {
    background: ${(p) => p.theme.cores.border};
    color: ${(p) => p.theme.cores.text};
  }
`;

const Vazio = styled.div`
  padding: 22px 10px;
  text-align: center;
  font-size: 12.5px;
  color: ${(p) => p.theme.cores.textMuted};
`;

export function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [itens, setItens] = useState<Notif[]>(ITENS);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const naoLidas = itens.filter((n) => !n.lida).length;
  const rotulo = naoLidas > 9 ? "9+" : String(naoLidas);

  function marcarLida(id: string) {
    setItens((atual) => atual.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }

  function remover(id: string) {
    setItens((atual) => atual.filter((n) => n.id !== id));
  }

  function marcarTodas() {
    setItens((atual) => atual.map((n) => ({ ...n, lida: true })));
  }

  function abrir() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: Math.max(8, r.right - 320) });
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

  return (
    <>
      <Botao
        ref={triggerRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-label="notificações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        title="Notificações"
      >
        <Bell size={18} />
        {naoLidas > 0 && <Badge>{rotulo}</Badge>}
      </Botao>

      {aberto &&
        pos &&
        createPortal(
          <Menu ref={menuRef} role="menu" style={{ top: pos.top, left: pos.left }}>
            <Cabecalho>
              <Titulo>Notificações</Titulo>
              {naoLidas > 0 && (
                <MarcarTodas type="button" onClick={marcarTodas}>
                  <CheckCheck size={13} />
                  Marcar todas como lidas
                </MarcarTodas>
              )}
            </Cabecalho>

            {itens.length === 0 ? (
              <Vazio>Nenhuma notificação.</Vazio>
            ) : (
              itens.map((n) => (
                <Item
                  key={n.id}
                  role="menuitem"
                  tabIndex={0}
                  $lida={n.lida}
                  onClick={() => marcarLida(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      marcarLida(n.id);
                    }
                  }}
                  title={n.lida ? "Lida" : "Clique para marcar como lida"}
                >
                  <ItemIcone $lida={n.lida}>
                    <n.Icon size={16} />
                  </ItemIcone>
                  <ItemTexto>
                    <TituloLinha $lida={n.lida}>
                      {!n.lida && <Ponto />}
                      {n.titulo}
                    </TituloLinha>
                    <Quando>{n.quando}</Quando>
                  </ItemTexto>
                  <Fechar
                    type="button"
                    aria-label="remover notificação"
                    title="Remover"
                    onClick={(e) => {
                      e.stopPropagation();
                      remover(n.id);
                    }}
                  >
                    <X size={13} />
                  </Fechar>
                </Item>
              ))
            )}
          </Menu>,
          document.body,
        )}
    </>
  );
}
