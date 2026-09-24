-- CreateTable
CREATE TABLE "RevisaoFlashcard" (
    "id" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "cardsFeitos" INTEGER NOT NULL,
    "cardsCorretos" INTEGER NOT NULL,
    "ultimaRevisao" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisaoFlashcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevisaoFlashcard_materia_syncedAt_idx" ON "RevisaoFlashcard"("materia", "syncedAt");
