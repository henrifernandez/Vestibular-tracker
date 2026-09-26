// Migração pontual: reestrutura o Provão Paulista Seriado com base no relatório
// de desempenho de 26/09/2026 (relatorio-provao-paulista.pdf). O 1º e 2º ano já
// entram como histórico fixo (a nota deles não muda mais); o que resta ativo é o
// 3º ano, quebrado nas 4 áreas reais da prova (Linguagens/Natureza/Matemática/
// Humanas, 90 questões) + Redação, cada uma com 3 metas por curso — mesmo padrão
// de várias metas por área que o ENEM-USP já usa.
//
// Seguro de rodar mais de uma vez: usa upsert nas áreas/metas e só cria o
// histórico do 1º/2º ano se ainda não existir nenhum resultado nessas áreas.
//
// Uso: npx tsx prisma/migrate-provao-v2.ts   (roda contra o DATABASE_URL do .env)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MetaSeed = { label: string; acertosAlvo?: number; notaAlvo?: number; observacao: string };
type AreaSeed = { nome: string; totalQuestoes: number; ordem: number; metas: MetaSeed[] };

const areas: AreaSeed[] = [
  {
    nome: "1º Ano (2023)",
    totalQuestoes: 90,
    ordem: 1,
    metas: [
      {
        label: "Resultado definitivo (peso 15% da nota final)",
        acertosAlvo: 43,
        observacao: "Contribuição fixa: 0,72 ponto (escala 0-10). Já contabilizado, não muda mais.",
      },
    ],
  },
  {
    nome: "2º Ano (2024)",
    totalQuestoes: 90,
    ordem: 2,
    metas: [
      {
        label: "Resultado definitivo (peso 25% da nota final)",
        acertosAlvo: 58,
        observacao: "Contribuição fixa: 1,61 ponto (escala 0-10). Já contabilizado, não muda mais.",
      },
    ],
  },
  {
    nome: "Linguagens",
    totalQuestoes: 24,
    ordem: 3,
    metas: [
      { label: "Meta Unicamp CC (mais realista)", acertosAlvo: 18, observacao: "Parte da meta agregada de 65–70/90 (Unicamp CC), distribuída proporcionalmente pelo nº de questões da área." },
      { label: "Meta EACH-USP SI (secundária)", acertosAlvo: 20, observacao: "Parte da meta agregada de 71–76/90 (EACH-USP Sistemas de Informação)." },
      { label: "Meta IME-USP (tiro longo)", acertosAlvo: 23, observacao: "Parte da meta agregada de 83–87+/90 (IME-USP). Relatório recomenda FUVEST/ENEM-USP como vias principais para esse curso." },
    ],
  },
  {
    nome: "Ciências da Natureza",
    totalQuestoes: 24,
    ordem: 4,
    metas: [
      { label: "Meta Unicamp CC (mais realista)", acertosAlvo: 18, observacao: "Parte da meta agregada de 65–70/90 (Unicamp CC)." },
      { label: "Meta EACH-USP SI (secundária)", acertosAlvo: 20, observacao: "Parte da meta agregada de 71–76/90 (EACH-USP Sistemas de Informação)." },
      { label: "Meta IME-USP (tiro longo)", acertosAlvo: 23, observacao: "Parte da meta agregada de 83–87+/90 (IME-USP). Relatório recomenda FUVEST/ENEM-USP como vias principais para esse curso." },
    ],
  },
  {
    nome: "Matemática",
    totalQuestoes: 18,
    ordem: 5,
    metas: [
      { label: "Meta Unicamp CC (mais realista)", acertosAlvo: 13, observacao: "Parte da meta agregada de 65–70/90. Relatório aponta Matemática como a maior alavanca (18 questões = 20% da prova objetiva)." },
      { label: "Meta EACH-USP SI (secundária)", acertosAlvo: 14, observacao: "Parte da meta agregada de 71–76/90." },
      { label: "Meta IME-USP (tiro longo)", acertosAlvo: 17, observacao: "Parte da meta agregada de 83–87+/90 (IME-USP). Relatório recomenda FUVEST/ENEM-USP como vias principais para esse curso." },
    ],
  },
  {
    nome: "Ciências Humanas",
    totalQuestoes: 24,
    ordem: 6,
    metas: [
      { label: "Meta Unicamp CC (mais realista)", acertosAlvo: 18, observacao: "Parte da meta agregada de 65–70/90 (Unicamp CC)." },
      { label: "Meta EACH-USP SI (secundária)", acertosAlvo: 20, observacao: "Parte da meta agregada de 71–76/90 (EACH-USP Sistemas de Informação)." },
      { label: "Meta IME-USP (tiro longo)", acertosAlvo: 22, observacao: "Parte da meta agregada de 83–87+/90 (IME-USP). Relatório recomenda FUVEST/ENEM-USP como vias principais para esse curso." },
    ],
  },
  {
    nome: "Redação",
    totalQuestoes: 1,
    ordem: 7,
    metas: [
      { label: "Meta (mais realista)", notaAlvo: 18, observacao: "Escala 0–20 (Provão Paulista). Não pode zerar; mínimo 20% (4/20) para não ser eliminado." },
    ],
  },
];

async function garantirHistorico(
  provaId: string,
  areaId: string,
  data: string,
  nome: string,
  acertos: number
) {
  const jaExiste = await prisma.resultado.findFirst({ where: { areaId } });
  if (jaExiste) return;
  await prisma.simulado.create({
    data: {
      provaId,
      data: new Date(data),
      nome,
      observacao: "Registrado a partir do relatório de desempenho; data exata da aplicação não informada.",
      resultados: { create: [{ areaId, acertos, totalQuestoes: 90 }] },
    },
  });
}

async function main() {
  const provao = await prisma.prova.findUnique({ where: { slug: "provao" } });
  if (!provao) throw new Error("Prova 'provao' não encontrada.");

  await prisma.prova.update({
    where: { id: provao.id },
    data: {
      descricao:
        "Exame seriado (1º + 2º + 3º ano) + redação. 1º e 2º ano já contam como histórico fixo (2,33 pontos de 10, pesos 15%+25%). Faltam 60% da nota final: 3º ano (40%, 90 questões) + redação (20%). Metas do 3º ano: Unicamp CC (mais realista), EACH-USP SI (secundária), IME-USP (tiro longo — considere FUVEST/ENEM-USP).",
    },
  });

  const antigas = await prisma.area.findMany({
    where: { provaId: provao.id, nome: { in: ["Prova III — objetiva", "Nota final (0–100)"] } },
  });
  for (const a of antigas) {
    await prisma.area.delete({ where: { id: a.id } });
  }

  const areaIds: Record<string, string> = {};
  for (const a of areas) {
    const area = await prisma.area.upsert({
      where: { provaId_nome: { provaId: provao.id, nome: a.nome } },
      update: { totalQuestoes: a.totalQuestoes, ordem: a.ordem },
      create: { provaId: provao.id, nome: a.nome, totalQuestoes: a.totalQuestoes, ordem: a.ordem },
    });
    areaIds[a.nome] = area.id;

    const existentes = await prisma.meta.findMany({ where: { areaId: area.id } });
    if (existentes.length === 0) {
      for (const m of a.metas) {
        await prisma.meta.create({
          data: {
            areaId: area.id,
            label: m.label,
            acertosAlvo: m.acertosAlvo,
            notaAlvo: m.notaAlvo,
            observacao: m.observacao,
          },
        });
      }
    }
  }

  await garantirHistorico(provao.id, areaIds["1º Ano (2023)"], "2023-11-01", "1º Ano do Ensino Médio (2023) — histórico", 43);
  await garantirHistorico(provao.id, areaIds["2º Ano (2024)"], "2024-11-01", "2º Ano do Ensino Médio (2024) — histórico", 58);

  console.log("Migração do Provão Paulista concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
