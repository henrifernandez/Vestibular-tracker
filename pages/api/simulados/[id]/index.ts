import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "id inválido" });

  if (req.method === "DELETE") {
    try {
      await prisma.simulado.delete({ where: { id } });
      return res.status(204).end();
    } catch (e: any) {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Simulado não encontrado (talvez já excluído)." });
      }
      console.error(e);
      return res.status(500).json({ error: "Não foi possível excluir o simulado." });
    }
  }

  if (req.method === "GET") {
    const simulado = await prisma.simulado.findUnique({
      where: { id },
      include: { prova: true, resultados: { include: { area: true, conteudosErrados: true } } },
    });
    if (!simulado) return res.status(404).json({ error: "não encontrado" });
    return res.status(200).json(simulado);
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  res.status(405).end();
}
