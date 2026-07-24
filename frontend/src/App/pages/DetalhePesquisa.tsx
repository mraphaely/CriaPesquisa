import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, PlayCircle } from "lucide-react";
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
  max-width: 820px;
  margin: 0 auto;
`;

const SecaoTitulo = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.theme.cores.primaryDark};
  margin: 0 0 4px;
`;

const SecaoBarra = styled.div`
  height: 4px;
  width: 46px;
  border-radius: 3px;
  background: ${(p) => p.theme.cores.accent};
  margin-bottom: 16px;
`;

const Bloco = styled.div`
  padding: 14px 0;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  &:first-child { border-top: none; }
`;

const Enunciado = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.text};
  margin-bottom: 4px;
`;

const Obrig = styled.span`
  color: ${(p) => p.theme.cores.danger};
  margin-left: 4px;
`;

const Ajuda = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  margin-bottom: 10px;
  line-height: 1.5;
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
          {c.limite && <Ajuda>Marcar até {c.limite}</Ajuda>}
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

  return (
    <Wrap>
      <PageHeader>
        <div>
          <PageTitle>{pesquisa.titulo}</PageTitle>
          <PageSubtitle>
            {pesquisa.descricao} · {totalPerguntas(pesquisa)} perguntas · {pesquisa.secoes.length} seções
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
          <Button>
            <PlayCircle size={16} /> Responder
          </Button>
        </div>
      </PageHeader>

      {pesquisa.secoes.map((sec) => (
        <Card key={sec.titulo} style={{ marginBottom: 16 }}>
          <SecaoTitulo>{sec.titulo}</SecaoTitulo>
          <SecaoBarra />
          {sec.campos.map((c) => (
            <Bloco key={c.n}>
              <Enunciado>
                {c.n}. {c.enunciado}
                {c.obrigatoria && <Obrig>*</Obrig>}
              </Enunciado>
              {c.ajuda && <Ajuda>{c.ajuda}</Ajuda>}
              <PreviewCampo c={c} />
            </Bloco>
          ))}
        </Card>
      ))}

      <Muted style={{ textAlign: "center", marginBottom: 8 }}>
        Pré-visualização do formulário. A coleta de respostas fica disponível com o backend conectado.
      </Muted>
    </Wrap>
  );
}
