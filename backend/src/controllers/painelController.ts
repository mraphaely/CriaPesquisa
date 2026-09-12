import type { Request, Response } from "express";
import { painelModel } from "../models/painelModel.js";

const ABREV_MES: Record<string, string> = {
  Janeiro: "Jan",
  Fevereiro: "Fev",
  Março: "Mar",
  Abril: "Abr",
  Maio: "Mai",
  Junho: "Jun",
  Julho: "Jul",
  Agosto: "Ago",
  Setembro: "Set",
  Outubro: "Out",
  Novembro: "Nov",
  Dezembro: "Dez",
};

/** Visão geral para o dashboard: agrega municípios, investimento, benefícios e respostas. */
export async function painel(_req: Request, res: Response) {
  const periodo = await painelModel.periodoMaisRecente();
  const [[totalPesquisas, publicadas], totalRespostas, pendentes] = await Promise.all([
    painelModel.contarPesquisas(),
    painelModel.contarRespostas(),
    painelModel.contarPendentes(),
  ]);

  const vazio = {
    totalBeneficiarios: 0,
    criancas: 0,
    gestantes: 0,
    municipios: 0,
    investimentoMensal: 0,
  };

  if (!periodo) {
    res.json({
      periodo: null,
      totais: vazio,
      municipios: [],
      investimento: { labels: [], data: [] },
      beneficios: [],
      distribuicoes: { raca: { labels: [], data: [] }, zona: { labels: [], data: [] } },
      pesquisas: { total: totalPesquisas, publicadas },
      respostas: { total: totalRespostas, pendentes },
    });
    return;
  }

  const [linhas, invest, beneficios, raca, zona] = await Promise.all([
    painelModel.municipiosDoPeriodo(periodo.ano, periodo.mes),
    painelModel.investimentoPorMes(),
    painelModel.beneficios(),
    painelModel.distribuicao("raça"),
    painelModel.distribuicao("zona"),
  ]);

  const totais = linhas.reduce(
    (acc, m) => ({
      totalBeneficiarios: acc.totalBeneficiarios + m.totalBeneficiarios,
      criancas: acc.criancas + m.criancas,
      gestantes: acc.gestantes + m.gestantes,
      investimentoMensal: acc.investimentoMensal + m.valorTotal,
    }),
    { totalBeneficiarios: 0, criancas: 0, gestantes: 0, investimentoMensal: 0 },
  );

  const serie = invest.slice(-18);

  res.json({
    periodo: { ano: periodo.ano, mes: periodo.mes, mesNome: periodo.mesNome },
    totais: { ...totais, municipios: linhas.length },
    municipios: linhas.map((m) => ({
      municipio: m.municipio,
      total: m.totalBeneficiarios,
      criancas: m.criancas,
      gestantes: m.gestantes,
    })),
    investimento: {
      labels: serie.map((s) => `${ABREV_MES[s.mesNome] ?? s.mesNome}/${String(s.ano).slice(2)}`),
      data: serie.map((s) => Math.round(((s._sum.valorTotal ?? 0) / 1e6) * 100) / 100),
    },
    beneficios: beneficios.map((b) => ({ label: b.label, quantidade: b.quantidade })),
    distribuicoes: { raca, zona },
    pesquisas: { total: totalPesquisas, publicadas },
    respostas: { total: totalRespostas, pendentes },
  });
}
