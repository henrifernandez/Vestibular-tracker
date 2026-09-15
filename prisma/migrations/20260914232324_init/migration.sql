-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "acertosAlvo" INTEGER,
    "notaAlvo" DOUBLE PRECISION,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulado" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "nome" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resultado" (
    "id" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "notaEstimada" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConteudoErrado" (
    "id" TEXT NOT NULL,
    "resultadoId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConteudoErrado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prova_slug_key" ON "Prova"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Area_provaId_nome_key" ON "Area"("provaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Resultado_simuladoId_areaId_key" ON "Resultado"("simuladoId", "areaId");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulado" ADD CONSTRAINT "Simulado_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConteudoErrado" ADD CONSTRAINT "ConteudoErrado_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "Resultado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
