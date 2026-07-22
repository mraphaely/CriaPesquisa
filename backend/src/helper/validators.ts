import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Pesquisa ----------

export const criarPesquisaSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  responsavelId: z.string().uuid(),
  periodoInicio: z.coerce.date().optional(),
  periodoFim: z.coerce.date().optional(),
});
export type CriarPesquisaInput = z.infer<typeof criarPesquisaSchema>;

export const atualizarPesquisaSchema = criarPesquisaSchema.partial();
export type AtualizarPesquisaInput = z.infer<typeof atualizarPesquisaSchema>;

// ---------- Seção / Pergunta / Opção ----------

export const opcaoSchema = z.object({
  texto: z.string().min(1),
  ordem: z.number().int().min(0),
});
export type OpcaoInput = z.infer<typeof opcaoSchema>;

export const perguntaSchema = z
  .object({
    enunciado: z.string().min(1),
    tipo: z.enum(["TEXTO", "NUMERO", "DATA", "MULTIPLA_ESCOLHA", "ESCOLHA_UNICA", "CAMPO_ABERTO"]),
    obrigatoria: z.boolean().default(false),
    ordem: z.number().int().min(0),
    secaoId: z.string().uuid().optional(),
    ajuda: z.string().optional(),
    opcoes: z.array(opcaoSchema).optional(),
  })
  .refine(
    (dados) => {
      const exigeOpcoes = dados.tipo === "MULTIPLA_ESCOLHA" || dados.tipo === "ESCOLHA_UNICA";
      const quantidade = dados.opcoes?.length ?? 0;
      return exigeOpcoes ? quantidade >= 2 : quantidade === 0;
    },
    {
      message:
        "Perguntas de múltipla escolha ou escolha única exigem ao menos 2 opções; demais tipos não devem ter opções.",
      path: ["opcoes"],
    },
  );
export type PerguntaInput = z.infer<typeof perguntaSchema>;

export const secaoSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  ordem: z.number().int().min(0),
});
export type SecaoInput = z.infer<typeof secaoSchema>;

export const reordenarSchema = z.object({
  ordem: z.array(z.string().uuid()).min(1),
});
export type ReordenarInput = z.infer<typeof reordenarSchema>;

// ---------- Resposta ----------

export const itemRespostaSchema = z.object({
  perguntaId: z.string().uuid(),
  valorTexto: z.string().optional(),
  valorNumero: z.number().optional(),
  valorData: z.coerce.date().optional(),
  opcoesSelecionadas: z.array(z.string()).optional(),
});
export type ItemRespostaInput = z.infer<typeof itemRespostaSchema>;

export const criarRespostaSchema = z.object({
  municipio: z.string().optional(),
  unidade: z.string().optional(),
  regional: z.string().optional(),
  itens: z.array(itemRespostaSchema).min(1),
});
export type CriarRespostaInput = z.infer<typeof criarRespostaSchema>;

// ---------- Usuário ----------

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: z.enum(["ADMIN", "GESTOR", "COLETADOR", "VISUALIZADOR"]),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  papel: z.enum(["ADMIN", "GESTOR", "COLETADOR", "VISUALIZADOR"]).optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6).optional(),
});
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
