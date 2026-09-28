import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { carregarFicticios, limparFicticios } from "@/lib/seed-ficticio";

// POST { acao: "carregar" | "limpar" }
// Grava/apaga simulados fictícios (marcados com "[dados fictícios]") no banco que o site usa.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }
  try {
    if (req.body?.acao === "limpar") {
      return res.status(200).json({ apagados: await limparFicticios(prisma) });
    }
    return res.status(200).json(await carregarFicticios(prisma));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao gravar." });
  }
}
