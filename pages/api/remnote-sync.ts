import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Formato enviado pelo plugin "Vestibular Tracker Sync" do RemNote.
type MateriaStatsInput = {
  materia: string;
  cardsFeitos: number;
  cardsCorretos: number;
  ultimaRevisao: string | null;
};

type SyncBody = {
  syncedAt: string;
  materias: MateriaStatsInput[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // O plugin do RemNote roda em outra origem (localhost:8080 durante o desenvolvimento,
  // ou o domínio do RemNote quando publicado), então precisa liberar CORS aqui.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    // Retorna, por matéria, o snapshot mais recente já recebido.
    const todas = await prisma.revisaoFlashcard.findMany({
      orderBy: { syncedAt: "desc" },
    });

    const ultimaPorMateria = new Map<string, (typeof todas)[number]>();
    for (const registro of todas) {
      if (!ultimaPorMateria.has(registro.materia)) {
        ultimaPorMateria.set(registro.materia, registro);
      }
    }

    return res.status(200).json(Array.from(ultimaPorMateria.values()));
  }

  if (req.method === "POST") {
    // Se REMNOTE_SYNC_TOKEN estiver configurado no .env, exige o mesmo token
    // configurado nas configurações do plugin (cabeçalho Authorization: Bearer <token>).
    const tokenEsperado = process.env.REMNOTE_SYNC_TOKEN;
    if (tokenEsperado) {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${tokenEsperado}`) {
        return res.status(401).json({ error: "token inválido ou ausente" });
      }
    }

    const { materias } = req.body as SyncBody;

    if (!Array.isArray(materias) || materias.length === 0) {
      return res.status(400).json({ error: "materias é obrigatório e não pode ser vazio" });
    }

    const criados = await prisma.$transaction(
      materias.map((m) =>
        prisma.revisaoFlashcard.create({
          data: {
            materia: m.materia,
            cardsFeitos: m.cardsFeitos,
            cardsCorretos: m.cardsCorretos,
            ultimaRevisao: m.ultimaRevisao ? new Date(m.ultimaRevisao) : null,
          },
        })
      )
    );

    return res.status(201).json({ recebidos: criados.length });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}