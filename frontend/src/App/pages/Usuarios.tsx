import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Users, Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { useUsuarios, useAtualizarUsuario, type Usuario, type Papel } from "../api/usuarios.js";
import { useAuth } from "../auth/useAuth.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Button,
  Card,
  Muted,
  Banner,
  EmptyState,
  EmptyIcon,
  SectionTitle,
  TableWrap,
  Tabela,
  Th,
  Td,
  Tag,
} from "../../Styles/ui.js";

const PAPEL_LABEL: Record<Papel, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor (PO)",
  COLETADOR: "Coletador",
  VISUALIZADOR: "Visualizador",
};

const tomDoPapel = (p: Papel): "blue" | "green" | "muted" => {
  if (p === "ADMIN") return "blue";
  if (p === "GESTOR") return "green";
  return "muted";
};

const AcoesLinha = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const IconBtn = styled.button<{ $perigo?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => (p.$perigo ? p.theme.cores.danger : p.theme.cores.textMuted)};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  &:hover:not(:disabled) {
    background: ${(p) => (p.$perigo ? `${p.theme.cores.danger}14` : p.theme.cores.surfaceAlt)};
    color: ${(p) => (p.$perigo ? p.theme.cores.danger : p.theme.cores.text)};
    border-color: ${(p) => (p.$perigo ? p.theme.cores.danger : p.theme.cores.accent)};
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export function Usuarios() {
  const navigate = useNavigate();
  const { usuario: atual } = useAuth();
  const { data, isLoading, isError } = useUsuarios();
  const atualizar = useAtualizarUsuario();

  const cabecalho = (
    <PageHeader>
      <div>
        <PageTitle>Usuários</PageTitle>
        <PageSubtitle>Gerencie o acesso da equipe</PageSubtitle>
      </div>
      <Button onClick={() => navigate("/usuarios/novo")}>
        <Plus size={16} />
        Novo usuário
      </Button>
    </PageHeader>
  );

  if (isLoading) {
    return (
      <div>
        {cabecalho}
        <Card>
          <Muted style={{ textAlign: "center", padding: "24px 0" }}>Carregando usuários…</Muted>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        {cabecalho}
        <Banner $tone="warn">Não foi possível carregar os usuários. Verifique se o servidor está no ar.</Banner>
      </div>
    );
  }

  function alternarAtivo(u: Usuario) {
    if (u.ativo) {
      if (!window.confirm(`Desativar o acesso de "${u.nome}"? Ele não conseguirá mais entrar.`)) return;
    }
    atualizar.mutate({ id: u.id, dados: { ativo: !u.ativo } });
  }

  return (
    <div>
      {cabecalho}

      {data.itens.length === 0 ? (
        <EmptyState>
          <EmptyIcon><Users size={26} /></EmptyIcon>
          <SectionTitle>Nenhum usuário ainda</SectionTitle>
          <Muted style={{ marginBottom: 18 }}>Cadastre o primeiro membro da equipe e defina o papel de acesso.</Muted>
          <Button onClick={() => navigate("/usuarios/novo")}>
            <Plus size={16} /> Novo usuário
          </Button>
        </EmptyState>
      ) : (
        <Card>
          <TableWrap>
            <Tabela>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Papel</Th>
                  <Th>Status</Th>
                  <Th style={{ textAlign: "right" }}>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((u) => {
                  const ehVoce = u.id === atual?.id;
                  return (
                    <tr key={u.id}>
                      <Td style={{ fontWeight: 600 }}>
                        {u.nome}
                        {ehVoce && <Tag $tone="muted" style={{ marginLeft: 8 }}>você</Tag>}
                      </Td>
                      <Td>{u.email}</Td>
                      <Td><Tag $tone={tomDoPapel(u.papel)}>{PAPEL_LABEL[u.papel]}</Tag></Td>
                      <Td><Tag $tone={u.ativo ? "green" : "muted"}>{u.ativo ? "Ativo" : "Inativo"}</Tag></Td>
                      <Td>
                        <AcoesLinha>
                          <IconBtn
                            type="button"
                            title="Editar"
                            aria-label={`editar ${u.nome}`}
                            onClick={() => navigate(`/usuarios/${u.id}/editar`)}
                          >
                            <Pencil size={15} />
                          </IconBtn>
                          <IconBtn
                            type="button"
                            $perigo={u.ativo}
                            disabled={ehVoce}
                            title={ehVoce ? "Você não pode desativar a si mesmo" : u.ativo ? "Desativar" : "Reativar"}
                            aria-label={`${u.ativo ? "desativar" : "reativar"} ${u.nome}`}
                            onClick={() => alternarAtivo(u)}
                          >
                            {u.ativo ? <UserX size={15} /> : <UserCheck size={15} />}
                          </IconBtn>
                        </AcoesLinha>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}
