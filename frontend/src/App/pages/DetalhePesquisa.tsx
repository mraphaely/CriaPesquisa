import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, PlayCircle, Search, ListChecks } from "lucide-react";
import { PESQUISAS_DEMO, totalPerguntas, type Campo } from "../data/pesquisaCrianca.js";
import {
  PageHeader,
  PageTitle,
  PageSubtitle,
  Card,
  Tag,
  Button,
  TextInput,
  Textarea,
  Select,
  Muted,
  TableWrap,
  Tabela,
  Th,
  Td,
} from "../../Styles/ui.js";

const Wrap = styled.div`
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
`;

const Busca = styled.div`
  position: relative;
  margin-bottom: 18px;
  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${(p) => p.theme.cores.textMuted};
  }
  input { padding-left: 42px; width: 100%; }
`;

const SecaoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const SecIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  flex-shrink: 0;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
`;

const SecaoTitulo = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
  margin: 0;
`;

const SecaoBarra = styled.div`
  height: 4px;
  width: 46px;
  border-radius: 3px;
  background: ${(p) => p.theme.cores.accent};
  margin: 4px 0 16px 48px;
`;

const Bloco = styled.div`
  padding: 16px 0;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  &:first-of-type { border-top: none; padding-top: 4px; }
`;

const EnunciadoLinha = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
`;

const NumBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 7px;
  flex-shrink: 0;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
  font-size: 12px;
  font-weight: 700;
`;

const Enunciado = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.text};
  line-height: 1.4;
`;

const Obrig = styled.span`
  color: ${(p) => p.theme.cores.danger};
  margin-left: 4px;
`;

const Ajuda = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  margin: 2px 0 10px 34px;
  line-height: 1.5;
`;

const CampoBox = styled.div`
  margin-left: 34px;
`;

const Opcao = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: ${(p) => p.theme.cores.text};
  padding: 5px 0;
  input { width: 15px; height: 15px; accent-color: ${(p) => p.theme.cores.primary}; }
`;

const Escala = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Bolha = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid ${(p) => p.theme.cores.border};
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.textMuted};
`;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PreviewCampo({ c }: { c: Campo }) {
  switch (c.tipo) {
    case "texto":
      return <TextInput disabled placeholder="Resposta de texto" />;
    case "paragrafo":
      return <Textarea disabled placeholder="Resposta longa…" />;
    case "numero":
      return <TextInput disabled type="number" placeholder="0" style={{ maxWidth: 200 }} />;
    case "data":
      return <TextInput disabled type="date" style={{ maxWidth: 200 }} />;
    case "selecao":
      return (
        <Select disabled defaultValue="" style={{ maxWidth: 320 }}>
          <option value="">Selecione…</option>
          {c.opcoes?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      );
    case "unica":
    case "multipla": {
      const tipo = c.tipo === "unica" ? "radio" : "checkbox";
      return (
        <div>
          {c.limite && <Ajuda style={{ margin: "0 0 6px" }}>Marcar até {c.limite}</Ajuda>}
          {c.opcoes?.map((o) => (
            <Opcao key={o}>
              <input type={tipo} disabled />
              {o}
            </Opcao>
          ))}
          {c.outro && (
            <Opcao>
              <input type={tipo} disabled />
              Outro…
            </Opcao>
          )}
        </div>
      );
    }
    case "escala": {
      const { min = 0, max = 5 } = c.escala ?? {};
      const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <Escala>
          {nums.map((n) => (
            <Bolha key={n}>{n}</Bolha>
          ))}
        </Escala>
      );
    }
    case "grade": {
      const g = c.grade!;
      return (
        <TableWrap>
          <Tabela>
            <thead>
              <tr>
                <Th></Th>
                {g.colunas.map((col) => (
                  <Th key={col} style={{ textAlign: "center" }}>{col}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.linhas.map((lin) => (
                <tr key={lin}>
                  <Td style={{ fontWeight: 600 }}>{lin}</Td>
                  {g.colunas.map((col) => (
                    <Td key={col} style={{ textAlign: "center" }}>
                      <input type="radio" disabled />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Tabela>
        </TableWrap>
      );
    }
    default:
      return null;
  }
}

export function DetalhePesquisa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pesquisa = PESQUISAS_DEMO.find((p) => p.id === id);
  const [busca, setBusca] = useState("");

  const total = pesquisa ? totalPerguntas(pesquisa) : 0;
  const mostrarBusca = total > 10;

  const secoes = useMemo(() => {
    if (!pesquisa) return [];
    const q = norm(busca.trim());
    if (!q) return pesquisa.secoes;
    return pesquisa.secoes
      .map((sec) => ({ ...sec, campos: sec.campos.filter((c) => norm(c.enunciado).includes(q)) }))
      .filter((sec) => sec.campos.length > 0);
  }, [pesquisa, busca]);

  if (!pesquisa) {
    return (
      <Wrap>
        <PageHeader>
          <PageTitle>Pesquisa não encontrada</PageTitle>
          <Button $variant="ghost" onClick={() => navigate("/pesquisas")}>
            <ArrowLeft size={16} /> Voltar
          </Button>
        </PageHeader>
      </Wrap>
    );
  }

  const totalFiltrado = secoes.reduce((s, sec) => s + sec.campos.length, 0);

  return (
    <Wrap>
      <PageHeader>
        <div>
          <PageTitle>{pesquisa.titulo}</PageTitle>
          <PageSubtitle>
            {pesquisa.descricao} · {total} perguntas · {pesquisa.secoes.length} seções
          </PageSubtitle>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <Tag $tone="green">{pesquisa.status}</Tag>
            <Tag $tone="blue">{pesquisa.tipo}</Tag>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button $variant="ghost" onClick={() => navigate("/pesquisas")}>
            <ArrowLeft size={16} /> Voltar
          </Button>
          <Button onClick={() => navigate(`/pesquisas/${pesquisa.id}/responder`)}>
            <PlayCircle size={16} /> Responder
          </Button>
        </div>
      </PageHeader>

      {mostrarBusca && (
        <Busca>
          <Search size={17} />
          <TextInput
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Pesquisar entre as ${total} perguntas…`}
            aria-label="pesquisar perguntas"
          />
        </Busca>
      )}

      {busca && (
        <Muted style={{ marginBottom: 12 }}>
          {totalFiltrado} resultado{totalFiltrado === 1 ? "" : "s"} para “{busca}”.
        </Muted>
      )}

      {secoes.length === 0 ? (
        <Card>
          <Muted style={{ textAlign: "center" }}>Nenhuma pergunta encontrada para “{busca}”.</Muted>
        </Card>
      ) : (
        secoes.map((sec) => (
          <Card key={sec.titulo} style={{ marginBottom: 16 }}>
            <SecaoHeader>
              <SecIcon>
                <ListChecks size={19} />
              </SecIcon>
              <SecaoTitulo>{sec.titulo}</SecaoTitulo>
            </SecaoHeader>
            <SecaoBarra />
            {sec.campos.map((c) => (
              <Bloco key={c.n}>
                <EnunciadoLinha>
                  <NumBadge>{c.n}</NumBadge>
                  <Enunciado>
                    {c.enunciado}
                    {c.obrigatoria && <Obrig>*</Obrig>}
                  </Enunciado>
                </EnunciadoLinha>
                {c.ajuda && <Ajuda>{c.ajuda}</Ajuda>}
                <CampoBox>
                  <PreviewCampo c={c} />
                </CampoBox>
              </Bloco>
            ))}
          </Card>
        ))
      )}

      <Muted style={{ textAlign: "center", marginBottom: 8 }}>
        Pré-visualização do formulário. A coleta de respostas fica disponível com o backend conectado.
      </Muted>
    </Wrap>
  );
}
