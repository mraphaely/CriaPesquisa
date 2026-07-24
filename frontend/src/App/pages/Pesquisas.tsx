import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Plus, ClipboardList } from "lucide-react";
import { PESQUISAS_DEMO, totalPerguntas } from "../data/pesquisaCrianca.js";
import { PageHeader, PageTitle, PageSubtitle, Button, Card, Tag, Muted } from "../../Styles/ui.js";

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
`;

const Tags = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

export function Pesquisas() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>Pesquisas</PageTitle>
          <PageSubtitle>Crie, publique e acompanhe suas pesquisas</PageSubtitle>
        </div>
        <Button onClick={() => navigate("/pesquisas/nova")}>
          <Plus size={16} />
          Nova pesquisa
        </Button>
      </PageHeader>

      <Lista>
        {PESQUISAS_DEMO.map((p) => (
          <ItemCard key={p.id} onClick={() => navigate(`/pesquisas/${p.id}`)}>
            <Topo>
              <IconeBox>
                <ClipboardList size={20} />
              </IconeBox>
              <Titulo>{p.titulo}</Titulo>
            </Topo>
            <Muted style={{ fontSize: 13 }}>{p.descricao}</Muted>
            <Tags>
              <Tag $tone="green">{p.status}</Tag>
              <Tag $tone="blue">{p.tipo}</Tag>
              <Tag $tone="muted">{totalPerguntas(p)} perguntas</Tag>
            </Tags>
          </ItemCard>
        ))}
      </Lista>
    </div>
  );
}
