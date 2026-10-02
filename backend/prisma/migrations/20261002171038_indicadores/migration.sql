-- CreateEnum
CREATE TYPE "TipoIndicador" AS ENUM ('PROPORCAO', 'CRUZAMENTO', 'MEDIA', 'DERIVADA', 'COMPOSTO', 'CLASSIFICACAO', 'CONTAGEM', 'DISTRIBUICAO');

-- CreateEnum
CREATE TYPE "StatusIndicador" AS ENUM ('ATIVO', 'DEFINICAO_INCOMPLETA', 'INATIVO');

-- CreateEnum
CREATE TYPE "RecorteIndicador" AS ENUM ('ANTES_APOS');

-- CreateTable
CREATE TABLE "Indicador" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT,
    "tipo" "TipoIndicador" NOT NULL,
    "unidade" TEXT,
    "casasDecimais" INTEGER NOT NULL DEFAULT 1,
    "pesquisaId" TEXT,
    "config" JSONB NOT NULL,
    "recorte" "RecorteIndicador",
    "recorteConfig" JSONB,
    "meta" DOUBLE PRECISION,
    "formulaOriginal" TEXT,
    "status" "StatusIndicador" NOT NULL DEFAULT 'DEFINICAO_INCOMPLETA',
    "motivoIncompleto" TEXT,
    "origemPlanilha" INTEGER,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicadorDependencia" (
    "indicadorId" TEXT NOT NULL,
    "dependeDeId" TEXT NOT NULL,

    CONSTRAINT "IndicadorDependencia_pkey" PRIMARY KEY ("indicadorId","dependeDeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Indicador_codigo_key" ON "Indicador"("codigo");

-- CreateIndex
CREATE INDEX "Indicador_status_idx" ON "Indicador"("status");

-- CreateIndex
CREATE INDEX "Indicador_pesquisaId_idx" ON "Indicador"("pesquisaId");

-- CreateIndex
CREATE INDEX "Indicador_deletedAt_idx" ON "Indicador"("deletedAt");

-- CreateIndex
CREATE INDEX "IndicadorDependencia_dependeDeId_idx" ON "IndicadorDependencia"("dependeDeId");

-- AddForeignKey
ALTER TABLE "Indicador" ADD CONSTRAINT "Indicador_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "Pesquisa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicadorDependencia" ADD CONSTRAINT "IndicadorDependencia_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Indicador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicadorDependencia" ADD CONSTRAINT "IndicadorDependencia_dependeDeId_fkey" FOREIGN KEY ("dependeDeId") REFERENCES "Indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
