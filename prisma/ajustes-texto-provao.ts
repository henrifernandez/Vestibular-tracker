// Encurta a descrição do Provão Paulista — o detalhamento (pesos, metas por
// curso) já aparece nos próprios cards de meta e na "Nota final projetada",
// não precisa repetir tudo em texto corrido.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.prova.update({
    where: { slug: "provao" },
    data: { descricao: "Seriado (1º + 2º + 3º ano) + redação. 1º e 2º ano já contam fixo (2,33 pts)." },
  });
  console.log("Descrição do Provão encurtada.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
