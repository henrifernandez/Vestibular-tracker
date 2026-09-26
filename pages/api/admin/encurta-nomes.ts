import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const RENOMEACOES: Record<string, string> = {
  fuvest: "Fuvest",
  provao: "Provão Paulista",
  "unicamp-comvest": "Comvest",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" || req.query.confirm !== "SIM") {
    return res.status(400).json({ error: "use GET ?confirm=SIM" });
  }
  for (const [slug, nome] of Object.entries(RENOMEACOES)) {
    await prisma.prova.update({ where: { slug }, data: { nome } });
  }
  return res.status(200).json({ ok: true });
}
