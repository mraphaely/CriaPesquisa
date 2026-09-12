import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Plus, ClipboardList } from "lucide-react";
import { usePesquisas } from "../api/pesquisas.js";
import { useAuth } from "../auth/useAuth.js";
import { podeGerenciarPesquisas } from "../auth/permissoes.js";
import { AcoesPesquisa } from "../../Components/AcoesPesquisa.js";
import { PageHeader, PageTitle, PageSubtitle, Button, Card, Tag, Muted, Banner, EmptyState, EmptyIcon } from "../../Styles/ui.js";

const Lista = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
`;

const ItemCard = styled(Card)`
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px ${(p) => p.theme.cores.primary}22;
  }
`;

const Topo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const IconeBox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
`;

const Titulo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: ${(p) => p.theme.cores.text};
  line-height: 1.3;
  flex: 1;
  min-width: 0;
`;

const Tags = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

const tomDoStatus = (status: string): "green" | "blue" | "muted" => {
  if (status === "PUBLICADA") return "green";
  if (status === "RASCUNHO") return "blue";
  return "muted";
};

export function Pesquisas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const podeCriar = podeGerenciarPesquisas(usuario?.papel);
  const { data, isLoading, isError } = usePesquisas();

  const cabecalho = (
    <PageHeader>
      <div>
        <PageTitle>Pesquisas</PageTitle>
        <PageSubtitle>Crie, publique e acompanhe suas pesquisas</PageSubtitle>
      </div>
      {podeCriar && (
        <Button onClick={() => navigate("/pesquisas/nova")}>
          <Plus size={16} />
          Nova pesquisa
        </Button>
      )}
    </PageHeader>
  );

  if (isLoading) {
    return (
      <div>
        {cabecalho}
        <Card>
          <Muted style={{ textAlign: "center", padding: "24px 0" }}>Carregando pesquisas…</Muted>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        {cabecalho}
        <Banner $tone="warn">Não foi possível carregar as pesquisas. Verifique se o servidor está no ar.</Banner>
      </div>
    );
  }

  return (
    <div>
      {cabecalho}

      {data.itens.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <ClipboardList size={26} />
          </EmptyIcon>
          <PageTitle style={{ fontSize: 18 }}>Nenhuma pesquisa ainda</PageTitle>
          <Muted style={{ marginBottom: 18 }}>
            {podeCriar
              ? "Crie a primeira pesquisa para começar a coletar respostas."
              : "Nenhuma pesquisa disponível no momento."}
          </Muted>
          {podeCriar && (
            <Button onClick={() => navigate("/pesquisas/nova")}>
              <Plus size={16} /> Nova pesquisa
            </Button>
          )}
        </EmptyState>
      ) : (
        <Lista>
          {data.itens.map((p) => (
            <ItemCard key={p.id} onClick={() => navigate(`/pesquisas/${p.id}`)}>
              <Topo>
                <IconeBox>
                  <ClipboardList size={20} />
                </IconeBox>
                <Titulo>{p.titulo}</Titulo>
                {podeCriar && <AcoesPesquisa p={p} />}
              </Topo>
              {p.descricao && <Muted style={{ fontSize: 13 }}>{p.descricao}</Muted>}
              <Tags>
                <Tag $tone={tomDoStatus(p.status)}>{p.status}</Tag>
              </Tags>
            </ItemCard>
          ))}
        </Lista>
      )}
    </div>
  );
}
