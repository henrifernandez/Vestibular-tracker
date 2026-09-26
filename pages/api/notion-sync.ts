import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Formato enviado pelo workflow do n8n que lê as databases de cronograma no Notion
// (biologia, quimica, fisica-atual, dentro de "Planejamento para estudantes").
type PlanoEstudoInput = {
  notionUrl: string;
  materia: string;
  data: string;
  diaSemana?: string | null;
  topicos?: string | null;
  feito: boolean;
  observacoes?: string | null;
};

type SyncBody = {
  itens: PlanoEstudoInput[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // O n8n roda em outro host/origem (container Docker), então precisa liberar CORS aqui,
  // igual ao remnote-sync.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const itens = await prisma.planoEstudo.findMany({
      orderBy: { data: "desc" },
      take: 200,
    });
    return res.status(200).json(itens);
  }

  if (req.method === "POST") {
    // Se NOTION_SYNC_TOKEN estiver configurado no .env, exige o mesmo token
    // no cabeçalho Authorization do node HTTP Request do n8n.
    const tokenEsperado = process.env.NOTION_SYNC_TOKEN;
    if (tokenEsperado) {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${tokenEsperado}`) {
        return res.status(401).json({ error: "token inválido ou ausente" });
      }
    }

    const { itens } = req.body as SyncBody;

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: "itens é obrigatório e não pode ser vazio" });
    }

    const resultados = await prisma.$transaction(
      itens.map((item) =>
        prisma.planoEstudo.upsert({
          where: { notionUrl: item.notionUrl },
          create: {
            notionUrl: item.notionUrl,
            materia: item.materia,
            data: new Date(item.data),
            diaSemana: item.diaSemana ?? null,
            topicos: item.topicos ?? null,
            feito: item.feito,
            observacoes: item.observacoes ?? null,
          },
          update: {
            materia: item.materia,
            data: new Date(item.data),
            diaSemana: item.diaSemana ?? null,
            topicos: item.topicos ?? null,
            feito: item.feito,
            observacoes: item.observacoes ?? null,
            syncedAt: new Date(),
          },
        })
      )
    );

    return res.status(201).json({ sincronizados: resultados.length });
  }

  if (req.method === "DELETE") {
    // Remove uma linha por id, usado pra limpar entradas de teste/diagnostico.
    const { id } = req.body as { id?: string };
    if (!id) {
      return res.status(400).json({ error: "id é obrigatório" });
    }
    await prisma.planoEstudo.delete({ where: { id } }).catch(() => null);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end();
}
