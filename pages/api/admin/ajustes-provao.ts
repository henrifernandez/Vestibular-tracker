import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Endpoint temporario, uso unico: aplica em producao (1) a simplificacao da
// meta de Redacao do Provao pra um unico valor (nota 18) e (2) a descricao
// mais curta da prova. Removido do repositorio logo depois de usado.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" || req.query.confirm !== "SIM") {
    return res.status(400).json({ error: "use GET ?confirm=SIM" });
  }

  const provao = await prisma.prova.findUnique({ where: { slug: "provao" } });
  if (!provao) return res.status(404).json({ error: "prova 'provao' não encontrada" });

  await prisma.prova.update({
    where: { id: provao.id },
    data: { descricao: "Seriado (1º + 2º + 3º ano) + redação. 1º e 2º ano já contam fixo (2,33 pts)." },
  });

  const redacao = await prisma.area.findUnique({
    where: { provaId_nome: { provaId: provao.id, nome: "Redação" } },
  });
  if (!redacao) return res.status(404).json({ error: "área 'Redação' não encontrada" });

  const metas = await prisma.meta.findMany({ where: { areaId: redacao.id } });
  const secundarias = metas.filter((m) => m.label !== "Meta Unicamp CC (mais realista)");
  for (const m of secundarias) {
    await prisma.meta.delete({ where: { id: m.id } });
  }
  const principal = metas.find((m) => m.label === "Meta Unicamp CC (mais realista)");
  if (principal) {
    await prisma.meta.update({ where: { id: principal.id }, data: { label: "Meta (mais realista)", notaAlvo: 18 } });
  }

  return res.status(200).json({ ok: true });
}
