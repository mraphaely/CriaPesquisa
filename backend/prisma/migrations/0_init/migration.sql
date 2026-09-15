-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'GESTOR', 'COLETADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "StatusPesquisa" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "StatusResposta" AS ENUM ('PENDENTE', 'APROVADA', 'REPROVADA');

-- CreateEnum
CREATE TYPE "TipoPergunta" AS ENUM ('TEXTO', 'NUMERO', 'DATA', 'MULTIPLA_ESCOLHA', 'ESCOLHA_UNICA', 'CAMPO_ABERTO');

-- CreateEnum
CREATE TYPE "AcaoLog" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'PUBLICAR', 'ENCERRAR', 'ARQUIVAR', 'APROVAR', 'REPROVAR');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MunicipioMensal" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "mesNome" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "regional" TEXT NOT NULL,
    "totalBeneficiarios" INTEGER NOT NULL,
    "criancas" INTEGER NOT NULL,
    "gestantes" INTEGER NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "rendaMedia" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MunicipioMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficioComposicao" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "BeneficioComposicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesquisa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "responsavelId" TEXT NOT NULL,
    "status" "StatusPesquisa" NOT NULL DEFAULT 'RASCUNHO',
    "periodoInicio" DATE,
    "periodoFim" DATE,
    "publicadaEm" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "versaoAtual" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secao" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Secao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pergunta" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "secaoId" TEXT,
    "enunciado" TEXT NOT NULL,
    "tipo" "TipoPergunta" NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,
    "ajuda" TEXT,

    CONSTRAINT "Pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcaoPergunta" (
    "id" TEXT NOT NULL,
    "perguntaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "OpcaoPergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "coletadorId" TEXT NOT NULL,
    "municipio" TEXT,
    "unidade" TEXT,
    "regional" TEXT,
    "status" "StatusResposta" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "revisadoPorId" TEXT,
    "revisadoEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemResposta" (
    "id" TEXT NOT NULL,
    "respostaId" TEXT NOT NULL,
    "perguntaId" TEXT NOT NULL,
    "valorTexto" TEXT,
    "valorNumero" DOUBLE PRECISION,
    "valorData" DATE,
    "opcoesSelecionadas" TEXT[],

    CONSTRAINT "ItemResposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAlteracao" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" "AcaoLog" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAlteracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesquisaVersao" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesquisaVersao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "MunicipioMensal_ano_mes_idx" ON "MunicipioMensal"("ano", "mes");

-- CreateIndex
CREATE INDEX "MunicipioMensal_regional_idx" ON "MunicipioMensal"("regional");

-- CreateIndex
CREATE INDEX "MunicipioMensal_municipio_idx" ON "MunicipioMensal"("municipio");

-- CreateIndex
CREATE UNIQUE INDEX "MunicipioMensal_ano_mes_municipio_key" ON "MunicipioMensal"("ano", "mes", "municipio");

-- CreateIndex
CREATE INDEX "BeneficioComposicao_ano_mes_idx" ON "BeneficioComposicao"("ano", "mes");

-- CreateIndex
CREATE INDEX "Pesquisa_status_idx" ON "Pesquisa"("status");

-- CreateIndex
CREATE INDEX "Pesquisa_responsavelId_idx" ON "Pesquisa"("responsavelId");

-- CreateIndex
CREATE INDEX "Pesquisa_deletedAt_idx" ON "Pesquisa"("deletedAt");

-- CreateIndex
CREATE INDEX "Secao_pesquisaId_ordem_idx" ON "Secao"("pesquisaId", "ordem");

-- CreateIndex
CREATE INDEX "Pergunta_pesquisaId_ordem_idx" ON "Pergunta"("pesquisaId", "ordem");

-- CreateIndex
CREATE INDEX "OpcaoPergunta_perguntaId_ordem_idx" ON "OpcaoPergunta"("perguntaId", "ordem");

-- CreateIndex
CREATE INDEX "Resposta_pesquisaId_idx" ON "Resposta"("pesquisaId");

-- CreateIndex
CREATE INDEX "Resposta_municipio_idx" ON "Resposta"("municipio");

-- CreateIndex
CREATE INDEX "Resposta_enviadaEm_idx" ON "Resposta"("enviadaEm");

-- CreateIndex
CREATE INDEX "Resposta_deletedAt_idx" ON "Resposta"("deletedAt");

-- CreateIndex
CREATE INDEX "Resposta_status_idx" ON "Resposta"("status");

-- CreateIndex
CREATE INDEX "ItemResposta_respostaId_idx" ON "ItemResposta"("respostaId");

-- CreateIndex
CREATE INDEX "ItemResposta_perguntaId_idx" ON "ItemResposta"("perguntaId");

-- CreateIndex
CREATE INDEX "LogAlteracao_entidade_entidadeId_idx" ON "LogAlteracao"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "LogAlteracao_usuarioId_idx" ON "LogAlteracao"("usuarioId");

-- CreateIndex
CREATE INDEX "LogAlteracao_createdAt_idx" ON "LogAlteracao"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PesquisaVersao_pesquisaId_versao_key" ON "PesquisaVersao"("pesquisaId", "versao");

-- AddForeignKey
ALTER TABLE "Pesquisa" ADD CONSTRAINT "Pesquisa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesquisa" ADD CONSTRAINT "Pesquisa_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secao" ADD CONSTRAINT "Secao_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "Pesquisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "Pesquisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "Secao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcaoPergunta" ADD CONSTRAINT "OpcaoPergunta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "Pesquisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_coletadorId_fkey" FOREIGN KEY ("coletadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemResposta" ADD CONSTRAINT "ItemResposta_respostaId_fkey" FOREIGN KEY ("respostaId") REFERENCES "Resposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemResposta" ADD CONSTRAINT "ItemResposta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAlteracao" ADD CONSTRAINT "LogAlteracao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesquisaVersao" ADD CONSTRAINT "PesquisaVersao_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "Pesquisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesquisaVersao" ADD CONSTRAINT "PesquisaVersao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

