import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Retorna, por matéria, o comparativo planejado (Notion) vs realizado (RemNote)
// num período (padrão: últimos 7 dias).
//
// Para "cardsFeitos"/"cardsCorretos" da semana: RevisaoFlashcard guarda o total
// acumulado a cada sincronização, não o delta. Por isso calculamos aqui:
// delta = (último registro dentro do período) - (último registro antes do período).
// Se não existir registro antes do período, o delta vira o próprio total acumulado
// (equivale a "desde o início").
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const agora = new Date();
  const fim = req.query.fim ? new Date(String(req.query.fim)) : agora;
  const inicio = req.query.inicio
    ? new Date(String(req.query.inicio))
    : new Date(fim.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [revisoes, plano] = await Promise.all([
    prisma.revisaoFlashcard.findMany({
      orderBy: { syncedAt: "asc" },
    }),
    prisma.planoEstudo.findMany({
      where: { data: { gte: inicio, lte: fim } },
    }),
  ]);

  const porMateriaRevisao = new Map<string, typeof revisoes>();
  for (const r of revisoes) {
    const lista = porMateriaRevisao.get(r.materia) ?? [];
    lista.push(r);
    porMateriaRevisao.set(r.materia, lista);
  }

  const porMateriaPlano = new Map<string, typeof plano>();
  for (const p of plano) {
    const lista = porMateriaPlano.get(p.materia) ?? [];
    lista.push(p);
    porMateriaPlano.set(p.materia, lista);
  }

  const materias = new Set([...porMateriaRevisao.keys(), ...porMateriaPlano.keys()]);

  const porMateria = Array.from(materias).map((materia) => {
    const historico = porMateriaRevisao.get(materia) ?? [];
    const antesDoPeriodo = historico.filter((r) => r.syncedAt < inicio).at(-1);
    const dentroDoPeriodo = historico.filter((r) => r.syncedAt <= fim).at(-1);

    const cardsFeitosSemana = dentroDoPeriodo
      ? dentroDoPeriodo.cardsFeitos - (antesDoPeriodo?.cardsFeitos ?? 0)
      : 0;
    const cardsCorretosSemana = dentroDoPeriodo
      ? dentroDoPeriodo.cardsCorretos - (antesDoPeriodo?.cardsCorretos ?? 0)
      : 0;

    const diasPlano = porMateriaPlano.get(materia) ?? [];

    return {
      materia,
      cardsFeitosSemana: Math.max(0, cardsFeitosSemana),
      cardsCorretosSemana: Math.max(0, cardsCorretosSemana),
      taxaAcertoSemana:
        cardsFeitosSemana > 0
          ? Math.round((cardsCorretosSemana / cardsFeitosSemana) * 100)
          : null,
      diasPlanejados: diasPlano.length,
      diasFeitos: diasPlano.filter((d) => d.feito).length,
    };
  });

  return res.status(200).json({
    periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    porMateria,
  });
}
