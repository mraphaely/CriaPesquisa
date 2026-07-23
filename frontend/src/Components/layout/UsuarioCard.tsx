import styled from "styled-components";
import { LogOut } from "lucide-react";
import { useAuth } from "../../App/auth/useAuth.js";

const Btn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${(p) => p.theme.cores.danger}22;
  color: ${(p) => p.theme.cores.danger};
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  transition: background 0.15s ease, filter 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.danger}33; filter: brightness(1.05); }

  @media (max-width: 860px) {
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
    <Btn type="button" onClick={sair} title="Sair" aria-label="sair">
      <LogOut size={19} />
      <Rotulo $colapsada={colapsada}>Sair</Rotulo>
    </Btn>
  );
}
