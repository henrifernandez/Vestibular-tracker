// Simplifica a meta de Redação do Provão Paulista: em vez de 3 níveis por
// curso (Unicamp/EACH/IME, que diferiam só por 1-2 pontos numa escala de 20),
// fica só a meta mais realista (nota 18), como pedido.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const provao = await prisma.prova.findUnique({ where: { slug: "provao" } });
  if (!provao) throw new Error("Prova 'provao' não encontrada.");

  const redacao = await prisma.area.findUnique({
    where: { provaId_nome: { provaId: provao.id, nome: "Redação" } },
  });
  if (!redacao) throw new Error("Área 'Redação' do Provão não encontrada.");

  const metas = await prisma.meta.findMany({ where: { areaId: redacao.id } });

  const secundarias = metas.filter((m) => m.label !== "Meta Unicamp CC (mais realista)");
  for (const m of secundarias) {
    await prisma.meta.delete({ where: { id: m.id } });
  }

  const principal = metas.find((m) => m.label === "Meta Unicamp CC (mais realista)");
  if (principal) {
    await prisma.meta.update({
      where: { id: principal.id },
      data: { label: "Meta (mais realista)", notaAlvo: 18 },
    });
  }

  console.log("Redação do Provão simplificada para uma única meta (nota 18).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
