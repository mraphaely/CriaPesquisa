import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { MoreVertical, Pencil, Upload, Ban, Archive, Trash2 } from "lucide-react";
import { useMudarStatusPesquisa, useRemoverPesquisa } from "../App/api/pesquisas.js";

export type AcoesPesquisaAlvo = { id: string; titulo: string; status: string };

const AcoesWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Kebab = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.textMuted};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover {
    background: ${(p) => p.theme.cores.surfaceAlt};
    color: ${(p) => p.theme.cores.text};
  }
`;

const Menu = styled.div`
  position: absolute;
  right: 0;
  top: 38px;
  z-index: 30;
  min-width: 180px;
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 10px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 6px;
`;

const MenuItem = styled.button<{ $perigo?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: ${(p) => (p.$perigo ? p.theme.cores.danger : p.theme.cores.text)};
  &:hover {
    background: ${(p) => (p.$perigo ? `${p.theme.cores.danger}14` : p.theme.cores.surfaceAlt)};
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
`;

// Menu de ações da pesquisa (Editar / Publicar / Encerrar / Arquivar / Excluir).
// Já assume que quem renderiza tem permissão (admin/gestor).
export function AcoesPesquisa({ p, aoExcluir }: { p: AcoesPesquisaAlvo; aoExcluir?: () => void }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const mudar = useMudarStatusPesquisa();
  const remover = useRemoverPesquisa();

  const acao = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    setAberto(false);
    fn();
  };

  return (
    <AcoesWrap onClick={(e) => e.stopPropagation()}>
      <Kebab
        type="button"
        aria-label="ações da pesquisa"
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setAberto((v) => !v);
        }}
      >
        <MoreVertical size={18} />
      </Kebab>
      {aberto && <Overlay onClick={acao(() => {})} />}
      {aberto && (
        <Menu role="menu">
          {p.status !== "ARQUIVADA" && (
            <MenuItem role="menuitem" onClick={acao(() => navigate(`/pesquisas/${p.id}/editar`))}>
              <Pencil size={15} /> Editar
            </MenuItem>
          )}
          {p.status === "RASCUNHO" && (
            <MenuItem role="menuitem" onClick={acao(() => mudar.mutate({ id: p.id, acao: "publicar" }))}>
              <Upload size={15} /> Publicar
            </MenuItem>
          )}
          {p.status === "PUBLICADA" && (
            <MenuItem role="menuitem" onClick={acao(() => mudar.mutate({ id: p.id, acao: "encerrar" }))}>
              <Ban size={15} /> Encerrar
            </MenuItem>
          )}
          {p.status !== "ARQUIVADA" && (
            <MenuItem role="menuitem" onClick={acao(() => mudar.mutate({ id: p.id, acao: "arquivar" }))}>
              <Archive size={15} /> Arquivar
            </MenuItem>
          )}
          <MenuItem
            role="menuitem"
            $perigo
            onClick={acao(() => {
              if (window.confirm(`Excluir a pesquisa "${p.titulo}"? Esta ação faz um soft-delete.`)) {
                remover.mutate(p.id, { onSuccess: () => aoExcluir?.() });
              }
            })}
          >
            <Trash2 size={15} /> Excluir
          </MenuItem>
        </Menu>
      )}
    </AcoesWrap>
  );
}
