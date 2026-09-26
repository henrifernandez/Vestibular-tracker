// Encurta os nomes das provas mais verbosas — o detalhe (curso, fase, escola)
// não precisa ir no nome, que aparece em todo canto (dashboard, lista de
// simulados, título da página de detalhe).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENOMEACOES: Record<string, string> = {
  fuvest: "Fuvest",
  provao: "Provão Paulista",
  "unicamp-comvest": "Comvest",
};

async function main() {
  for (const [slug, nome] of Object.entries(RENOMEACOES)) {
    await prisma.prova.update({ where: { slug }, data: { nome } });
  }
  console.log("Nomes encurtados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
