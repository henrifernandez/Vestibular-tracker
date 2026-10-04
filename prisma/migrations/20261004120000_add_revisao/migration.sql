-- CreateTable
CREATE TABLE "ConteudoRevisao" (
    "id" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "assuntoNorm" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL DEFAULT 'A classificar',
    "areaId" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "vezesErrado" INTEGER NOT NULL DEFAULT 0,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',
    "observacao" TEXT,
    "revisadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConteudoRevisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisaoLog" (
    "id" TEXT NOT NULL,
    "conteudoId" TEXT NOT NULL,
    "revisadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confianca" INTEGER,

    CONSTRAINT "RevisaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConteudoRevisao_status_prioridade_idx" ON "ConteudoRevisao"("status", "prioridade");

-- CreateIndex
CREATE UNIQUE INDEX "ConteudoRevisao_assuntoNorm_disciplina_key" ON "ConteudoRevisao"("assuntoNorm", "disciplina");

-- CreateIndex
CREATE INDEX "RevisaoLog_conteudoId_revisadoEm_idx" ON "RevisaoLog"("conteudoId", "revisadoEm");

-- AddForeignKey
ALTER TABLE "ConteudoRevisao" ADD CONSTRAINT "ConteudoRevisao_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisaoLog" ADD CONSTRAINT "RevisaoLog_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "ConteudoRevisao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

