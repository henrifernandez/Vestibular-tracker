import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ error: "id inválido" });

  const conteudos = await prisma.conteudoErrado.findMany({
    where: { resultado: { areaId: id } },
    select: { conteudo: true },
    distinct: ["conteudo"],
    orderBy: { conteudo: "asc" },
  });

  res.status(200).json(conteudos.map((c) => c.conteudo));
}
