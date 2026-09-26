// Quebra a prova única do Comvest (72 questões) em 3 áreas, na mesma lógica
// do Provão: Ciências da Natureza (21q) e Ciências Humanas (20q) têm fonte
// razoavelmente confiável (distribuição 2025 da 1ª fase Unicamp); Linguagens e
// Matemática ficam juntas (31q) porque não achei fonte que separe as duas.
// Metas antigas (49/72 mínima, 52/72 saudável) são rateadas proporcionalmente
// pelo nº de questões de cada área.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MetaSeed = { label: string; acertosAlvo: number; observacao: string };
type AreaSeed = { nome: string; totalQuestoes: number; ordem: number; metas: MetaSeed[] };

const areas: AreaSeed[] = [
  {
    nome: "Ciências da Natureza",
    totalQuestoes: 21,
    ordem: 1,
    metas: [
      { label: "Meta mínima (sobrevivência)", acertosAlvo: 14, observacao: "Parte da meta agregada de 49/72 (~68%), distribuída proporcionalmente pelo nº de questões da área." },
      { label: "Meta saudável (folga)", acertosAlvo: 15, observacao: "Parte da meta agregada de 52/72 (~70-72%)." },
    ],
  },
  {
    nome: "Ciências Humanas",
    totalQuestoes: 20,
    ordem: 2,
    metas: [
      { label: "Meta mínima (sobrevivência)", acertosAlvo: 14, observacao: "Parte da meta agregada de 49/72 (~68%), distribuída proporcionalmente pelo nº de questões da área." },
      { label: "Meta saudável (folga)", acertosAlvo: 14, observacao: "Parte da meta agregada de 52/72 (~70-72%)." },
    ],
  },
  {
    nome: "Linguagens e Matemática",
    totalQuestoes: 31,
    ordem: 3,
    metas: [
      { label: "Meta mínima (sobrevivência)", acertosAlvo: 21, observacao: "Parte da meta agregada de 49/72 (~68%). Linguagens e Matemática ficam juntas por falta de fonte que separe as duas nessa prova." },
      { label: "Meta saudável (folga)", acertosAlvo: 23, observacao: "Parte da meta agregada de 52/72 (~70-72%)." },
    ],
  },
];

async function main() {
  const comvest = await prisma.prova.findUnique({ where: { slug: "unicamp-comvest" } });
  if (!comvest) throw new Error("Prova 'unicamp-comvest' não encontrada.");

  await prisma.prova.update({
    where: { id: comvest.id },
    data: { descricao: "Prova objetiva única (72 questões, 3 áreas). Corte histórico (escola pública): ~48–52 acertos." },
  });

  const antigas = await prisma.area.findMany({
    where: { provaId: comvest.id, nome: "Prova objetiva (geral)" },
  });
  for (const a of antigas) {
    await prisma.area.delete({ where: { id: a.id } });
  }

  for (const a of areas) {
    const area = await prisma.area.upsert({
      where: { provaId_nome: { provaId: comvest.id, nome: a.nome } },
      update: { totalQuestoes: a.totalQuestoes, ordem: a.ordem },
      create: { provaId: comvest.id, nome: a.nome, totalQuestoes: a.totalQuestoes, ordem: a.ordem },
    });

    const existentes = await prisma.meta.findMany({ where: { areaId: area.id } });
    if (existentes.length === 0) {
      for (const m of a.metas) {
        await prisma.meta.create({
          data: { areaId: area.id, label: m.label, acertosAlvo: m.acertosAlvo, observacao: m.observacao },
        });
      }
    }
  }

  console.log("Comvest reestruturado em 3 áreas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
