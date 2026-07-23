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

/* Card completo (sidebar expandida) */
const CardWrap = styled.div<{ $colapsada: boolean }>`
  ${(p) => (p.$colapsada ? "display:none;" : "")}
  @media (max-width: 860px) { display: none; }
`;

/* Ícone de Sair (sidebar minimizada / mobile) */
const SairWrap = styled.div<{ $colapsada: boolean }>`
  display: ${(p) => (p.$colapsada ? "flex" : "none")};
  justify-content: center;
  @media (max-width: 860px) { display: flex; }
`;

const SairIcone = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: ${(p) => p.theme.cores.sidebarMuted};
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
`;

export function UsuarioCard({ colapsada }: { colapsada: boolean }) {
  const { usuario, sair } = useAuth();
  if (!usuario) return null;

  return (
    <>
      <CardWrap $colapsada={colapsada}>
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
      </CardWrap>

      <SairWrap $colapsada={colapsada}>
        <SairIcone type="button" onClick={sair} title="Sair" aria-label="sair">
          <LogOut size={20} />
        </SairIcone>
      </SairWrap>
    </>
  );
}
