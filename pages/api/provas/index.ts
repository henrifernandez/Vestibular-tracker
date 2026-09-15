import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const provas = await prisma.prova.findMany({
    include: {
      areas: {
        orderBy: { ordem: "asc" },
        include: { metas: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  res.status(200).json(provas);
}
