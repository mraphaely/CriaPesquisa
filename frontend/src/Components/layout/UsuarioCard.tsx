import styled from "styled-components";
import { LogOut, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../App/auth/useAuth.js";

const Grupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;

  @media (max-width: 860px) {
    flex-direction: row;
    width: auto;
  }
`;

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
  background: transparent;
  color: ${(p) => p.theme.cores.danger};
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  transition: background 0.15s ease;
  &:hover { background: ${(p) => p.theme.cores.danger}22; }

  @media (max-width: 860px) {
    width: auto;
  }
`;

const Rotulo = styled.span<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

const BtnNeutro = styled(Btn)`
  color: ${(p) => p.theme.cores.textMuted};
  font-weight: 600;
  &:hover {
    background: ${(p) => p.theme.cores.accentSoft};
    color: ${(p) => p.theme.cores.accent};
  }
`;

export function UsuarioCard({ colapsada }: { colapsada: boolean }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  return (
    <Grupo>
      <BtnNeutro
        type="button"
        onClick={() => navigate("/trocar-senha")}
        title="Trocar senha"
        aria-label="trocar senha"
      >
        <KeyRound size={18} />
        <Rotulo $colapsada={colapsada}>Trocar senha</Rotulo>
      </BtnNeutro>
      <Btn type="button" onClick={sair} title="Sair" aria-label="sair">
        <LogOut size={19} />
        <Rotulo $colapsada={colapsada}>Sair</Rotulo>
      </Btn>
    </Grupo>
  );
}
