// Cria UM simulado de exemplo (ENEM-USP) com dados fictícios, só para você
// testar dashboard, exportar, importar e excluir sem precisar digitar nada.
// Rode com: npm run seed:exemplo
// Pode excluir esse simulado a qualquer momento pela tela de "Simulados".

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const prova = await prisma.prova.findUnique({
    where: { slug: "enem-usp" },
    include: { areas: true },
  });

  if (!prova) {
    console.error(
      "Prova 'enem-usp' não encontrada. Rode 'npx prisma db seed' primeiro para carregar as provas/áreas/metas."
    );
    process.exit(1);
  }

  const acertosPorArea: Record<string, { acertos: number; conteudos: string[] }> = {
    "Matemática": {
      acertos: 34,
      conteudos: ["funções do 2º grau", "geometria espacial", "porcentagem"],
    },
    "Ciências da Natureza": {
      acertos: 30,
      conteudos: ["genética", "leis de Newton"],
    },
    "Ciências Humanas": {
      acertos: 32,
      conteudos: ["geografia econômica", "história do Brasil república"],
    },
    "Linguagens": {
      acertos: 36,
      conteudos: ["interpretação de texto", "figuras de linguagem"],
    },
    "Redação": {
      acertos: 1,
      conteudos: [],
    },
  };

  const resultados = prova.areas
    .filter((a) => acertosPorArea[a.nome])
    .map((a) => ({
      areaId: a.id,
      acertos: acertosPorArea[a.nome].acertos,
      totalQuestoes: a.totalQuestoes,
      conteudosErrados: {
        create: acertosPorArea[a.nome].conteudos.map((c) => ({ conteudo: c })),
      },
    }));

  const simulado = await prisma.simulado.create({
    data: {
      provaId: prova.id,
      data: new Date(),
      nome: "Simulado de exemplo (gerado para teste)",
      observacao: "Criado automaticamente para testar dashboard, exportar, importar e excluir.",
      resultados: { create: resultados },
    },
  });

  console.log(`Simulado de exemplo criado: ${simulado.id}`);
  console.log("Você já pode ver ele no dashboard e na tela de Simulados, e excluir quando quiser.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
