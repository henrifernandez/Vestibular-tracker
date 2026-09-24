// Popula o banco com as provas, áreas e metas descritas no relatório
// "Metas de acertos e notas para IME-USP, Unicamp e ENEM/Provão na reta final".
// Todas as metas podem ser editadas depois pela interface — isso aqui é só o ponto de partida.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AreaSeed = {
  nome: string;
  totalQuestoes: number;
  ordem: number;
  metas: {
    label: string;
    acertosAlvo?: number;
    notaAlvo?: number;
    observacao?: string;
  }[];
};

type ProvaSeed = {
  slug: string;
  nome: string;
  descricao: string;
  areas: AreaSeed[];
};

const provas: ProvaSeed[] = [
  {
    slug: "enem",
    nome: "ENEM (registro único)",
    descricao:
      "Registre aqui os acertos do ENEM uma única vez. O resultado é copiado automaticamente para o ENEM-USP e para o ENEM/SISU (Unicamp), já que é a mesma prova.",
    areas: [
      { nome: "Matemática", totalQuestoes: 45, ordem: 1, metas: [] },
      { nome: "Ciências da Natureza", totalQuestoes: 45, ordem: 2, metas: [] },
      { nome: "Ciências Humanas", totalQuestoes: 45, ordem: 3, metas: [] },
      { nome: "Linguagens", totalQuestoes: 45, ordem: 4, metas: [] },
      { nome: "Redação", totalQuestoes: 1, ordem: 5, metas: [] },
    ],
  },
  {
    slug: "enem-usp",
    nome: "ENEM-USP (IME — Ciência da Computação)",
    descricao:
      "Meta de média ponderada NF ≥ 830. Pesos: Matemática 3, Linguagens 2, Natureza 2, Redação 2, Humanas 1.",
    areas: [
      {
        nome: "Matemática",
        totalQuestoes: 45,
        ordem: 1,
        metas: [
          {
            label: "Meta para NF ≈ 830",
            acertosAlvo: 40,
            notaAlvo: 900,
            observacao: "Faixa estimada: ~38–40 acertos de 45",
          },
        ],
      },
      {
        nome: "Ciências da Natureza",
        totalQuestoes: 45,
        ordem: 2,
        metas: [
          {
            label: "Meta para NF ≈ 830",
            acertosAlvo: 41,
            notaAlvo: 820,
            observacao: "Faixa estimada: ~40–42 acertos de 45",
          },
        ],
      },
      {
        nome: "Ciências Humanas",
        totalQuestoes: 45,
        ordem: 3,
        metas: [
          {
            label: "Meta para NF ≈ 830",
            acertosAlvo: 39,
            notaAlvo: 760,
            observacao: "Faixa estimada: ~38–40 acertos de 45",
          },
        ],
      },
      {
        nome: "Linguagens",
        totalQuestoes: 45,
        ordem: 4,
        metas: [
          {
            label: "Meta para NF ≈ 830",
            acertosAlvo: 43,
            notaAlvo: 780,
            observacao: "Faixa estimada: ~42–44 acertos de 45",
          },
        ],
      },
      {
        nome: "Redação",
        totalQuestoes: 1,
        ordem: 5,
        metas: [
          {
            label: "Meta prática",
            notaAlvo: 900,
            observacao: "Nota de redação (0–1000). Objetivo do cenário: ≈820, meta prática ≥900",
          },
        ],
      },
    ],
  },
  {
    slug: "unicamp-sisu",
    nome: "ENEM/SISU (Unicamp — Ciência da Computação)",
    descricao: "Meta de média simples das 5 provas ≥ 750 pontos.",
    areas: [
      {
        nome: "Matemática",
        totalQuestoes: 45,
        ordem: 1,
        metas: [
          {
            label: "Meta para média ≈ 750",
            acertosAlvo: 38,
            notaAlvo: 840,
            observacao: "Faixa estimada: ~35–38 acertos de 45",
          },
        ],
      },
      {
        nome: "Ciências da Natureza",
        totalQuestoes: 45,
        ordem: 2,
        metas: [
          {
            label: "Meta para média ≈ 750",
            acertosAlvo: 38,
            notaAlvo: 780,
            observacao: "Faixa estimada: ~35–38 acertos de 45",
          },
        ],
      },
      {
        nome: "Ciências Humanas",
        totalQuestoes: 45,
        ordem: 3,
        metas: [
          {
            label: "Meta para média ≈ 750",
            acertosAlvo: 38,
            notaAlvo: 770,
            observacao: "Faixa estimada: ~35–38 acertos de 45",
          },
        ],
      },
      {
        nome: "Linguagens",
        totalQuestoes: 45,
        ordem: 4,
        metas: [
          {
            label: "Meta para média ≈ 750",
            acertosAlvo: 38,
            notaAlvo: 750,
            observacao: "Faixa estimada: ~34–38 acertos de 45",
          },
        ],
      },
      {
        nome: "Redação",
        totalQuestoes: 1,
        ordem: 5,
        metas: [
          {
            label: "Meta prática",
            notaAlvo: 800,
            observacao: "Meta prática ≥800 pontos",
          },
        ],
      },
    ],
  },
  {
    slug: "unicamp-comvest",
    nome: "Vestibular Unicamp — COMVEST (1ª fase, Ciência da Computação)",
    descricao: "Prova objetiva única de 72 questões. Corte histórico (escola pública): ~48–52 acertos.",
    areas: [
      {
        nome: "Prova objetiva (geral)",
        totalQuestoes: 72,
        ordem: 1,
        metas: [
          {
            label: "Meta mínima (sobrevivência)",
            acertosAlvo: 49,
            observacao: "≈68% de acertos, alinhado ao corte histórico de escola pública",
          },
          {
            label: "Meta saudável (folga)",
            acertosAlvo: 52,
            observacao: "≈70–72% de acertos, com margem para anos mais competitivos",
          },
        ],
      },
    ],
  },
  {
    slug: "fuvest",
    nome: "Fuvest (1ª fase — IME-USP, Computação)",
    descricao: "Prova objetiva única de 90 questões. Carreira de Computação tem cortes entre os mais altos.",
    areas: [
      {
        nome: "Prova objetiva (geral)",
        totalQuestoes: 90,
        ordem: 1,
        metas: [
          {
            label: "Meta conservadora",
            acertosAlvo: 63,
            observacao: "≈70% de acertos",
          },
          {
            label: "Meta agressiva",
            acertosAlvo: 68,
            observacao: "≈75% de acertos",
          },
        ],
      },
    ],
  },
  {
    slug: "provao",
    nome: "Provão Paulista (Grupo C — escola pública)",
    descricao:
      "Exame seriado. Edital exige mínimo de 22 acertos na Prova III para disputar vagas de graduação, incluindo Computação.",
    areas: [
      {
        nome: "Prova III — objetiva",
        totalQuestoes: 70,
        ordem: 1,
        metas: [
          {
            label: "Requisito mínimo do edital",
            acertosAlvo: 22,
            observacao:
              "Número total de questões da Prova III não vem especificado no relatório-fonte; ajuste este valor se souber o total exato do seu edital.",
          },
        ],
      },
      {
        nome: "Nota final (0–100)",
        totalQuestoes: 100,
        ordem: 2,
        metas: [
          {
            label: "Meta mínima",
            notaAlvo: 54,
            observacao: "Garante classificação em listas mais baixas",
          },
          {
            label: "Meta saudável",
            notaAlvo: 60,
            observacao: "Aumenta a chance de ser chamado nas primeiras listas para Computação",
          },
        ],
      },
    ],
  },
];

async function main() {
  for (const p of provas) {
    const prova = await prisma.prova.upsert({
      where: { slug: p.slug },
      update: { nome: p.nome, descricao: p.descricao },
      create: { slug: p.slug, nome: p.nome, descricao: p.descricao },
    });

    for (const a of p.areas) {
      const area = await prisma.area.upsert({
        where: { provaId_nome: { provaId: prova.id, nome: a.nome } },
        update: { totalQuestoes: a.totalQuestoes, ordem: a.ordem },
        create: {
          provaId: prova.id,
          nome: a.nome,
          totalQuestoes: a.totalQuestoes,
          ordem: a.ordem,
        },
      });

      // Evita duplicar metas se o seed rodar mais de uma vez
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
  }

  console.log("Seed concluído: provas, áreas e metas carregadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
