-- CreateTable
CREATE TABLE "PlanoEstudo" (
    "id" TEXT NOT NULL,
    "notionUrl" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "diaSemana" TEXT,
    "topicos" TEXT,
    "feito" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanoEstudo_notionUrl_key" ON "PlanoEstudo"("notionUrl");

-- CreateIndex
CREATE INDEX "PlanoEstudo_materia_data_idx" ON "PlanoEstudo"("materia", "data");
