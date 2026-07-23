import styled from "styled-components";
import { LogOut } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";

const Btn = styled.button<{ $colapsada: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  color: ${(p) => p.theme.cores.sidebarMuted};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  justify-content: ${(p) => (p.$colapsada ? "center" : "flex-start")};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

  @media (max-width: 860px) {
    justify-content: center;
    width: auto;
  }
`;

const Rotulo = styled.span<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

export function UsuarioCard({ colapsada }: { colapsada: boolean }) {
  const { usuario, sair } = useAuth();
  if (!usuario) return null;

  return (
    <Btn type="button" onClick={sair} $colapsada={colapsada} title="Sair" aria-label="sair">
      <LogOut size={19} />
      <Rotulo $colapsada={colapsada}>Sair</Rotulo>
    </Btn>
  );
}
