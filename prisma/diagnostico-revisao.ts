// Diagnóstico SOMENTE LEITURA da seção Revisão. Não grava nem apaga nada.
// Mostra para qual banco o .env aponta (só host e nome, nunca a URL completa), as contagens
// das tabelas e o que a sincronização dos simulados faria.
//
// Uso (na pasta do projeto):
//   npx tsx prisma/diagnostico-revisao.ts
//   npx tsx prisma/diagnostico-revisao.ts --site https://vestibular-tracker-five.vercel.app
// Com --site, o script lê apenas as rotas GET públicas do site (/api/simulados e
// /api/revisao) e mostra o que a sincronização criaria lá. Serve para comparar o banco
// do site com o banco do .env.
import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  agruparErros,
  classificarDisciplina,
  MIN_ERROS_PRIORIDADE_ALTA,
  planejarSincronizacao,
  type GrupoAssunto,
} from "../lib/revisao";

const MARCA_FICTICIO = "[dados fictícios]";

function hostDoBanco(): string {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return `${u.hostname} (banco ${u.pathname.replace("/", "") || "?"})`;
  } catch {
    return "DATABASE_URL ausente ou ilegível";
  }
}

function linhaGrupo(g: GrupoAssunto) {
  const prioridade = g.vezes >= MIN_ERROS_PRIORIDADE_ALTA ? "ALTA " : "MEDIA";
  const disc = classificarDisciplina(g.assunto, g.areaNome);
  return `   ${prioridade} | ${String(g.vezes).padStart(2)}x em ${g.simulados} simulado(s) | ${disc.padEnd(13)} | ${g.assunto}`;
}

async function diagnosticoDoSite(base: string) {
  const url = base.replace(/\/$/, "");
  console.log("== Site (somente GET)");
  console.log("endereço:", url);
  const simulados: any[] = await (await fetch(`${url}/api/simulados`)).json();
  const revisao: any[] = await (await fetch(`${url}/api/revisao`)).json();
  const ficticio = (s: any) => (s.observacao ?? "").startsWith(MARCA_FICTICIO);
  const erros = (lista: any[]) =>
    lista.reduce((a, s) => a + s.resultados.reduce((b: number, r: any) => b + r.conteudosErrados.length, 0), 0);
  console.log("Simulado:", simulados.length, `(fictícios ${simulados.filter(ficticio).length})`);
  console.log("ConteudoErrado:", erros(simulados));
  console.log("ConteudoRevisao:", revisao.length);

  const resultados = simulados
    .flatMap((s) =>
      s.resultados.map((r: any) => ({
        areaId: r.areaId,
        area: { nome: r.area.nome },
        simulado: { id: s.id, data: new Date(s.data), nome: s.nome, observacao: s.observacao, createdAt: new Date(s.createdAt) },
        conteudosErrados: r.conteudosErrados,
        criadoEm: String(r.createdAt),
      })),
    )
    .filter((r) => r.conteudosErrados.length > 0)
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  const grupos = agruparErros(resultados);
  const existentes = new Set(revisao.map((r) => r.assuntoNorm));

  console.log(`\n== Assuntos que a sincronização traria (${grupos.size})`);
  const { normalizarAssunto } = await import("../lib/revisao");
  for (const g of grupos.values()) console.log(linhaGrupo(g) + (existentes.has(normalizarAssunto(g.assunto)) ? "  (ja existe)" : ""));
  console.log("\n== Itens hoje na Revisão do site");
  for (const r of revisao) console.log(`   ${r.origem.padEnd(8)} ${r.status.padEnd(9)} ${r.prioridade.padEnd(5)} ${r.disciplina.padEnd(10)} | ${String(r.assunto).slice(0, 70)}`);
}

async function diagnosticoDoEnv() {
  console.log("== Banco do .env");
  console.log("host:", hostDoBanco());

  const simulados = await prisma.simulado.findMany({
    include: { prova: true, resultados: { include: { conteudosErrados: true, area: true } } },
    orderBy: { data: "asc" },
  });
  const ficticios = simulados.filter((s) => (s.observacao ?? "").startsWith(MARCA_FICTICIO));
  const reais = simulados.filter((s) => !ficticios.includes(s));
  const contarErros = (lista: typeof simulados) =>
    lista.reduce((a, s) => a + s.resultados.reduce((b, r) => b + r.conteudosErrados.length, 0), 0);

  console.log("\n== Contagens");
  console.log("Simulado:", simulados.length, `(reais ${reais.length}, fictícios ${ficticios.length})`);
  console.log("Resultado:", simulados.reduce((a, s) => a + s.resultados.length, 0));
  console.log("ConteudoErrado:", contarErros(simulados), `(em simulados reais: ${contarErros(reais)})`);
  const revisao = await prisma.conteudoRevisao.findMany();
  const porOrigem = revisao.reduce<Record<string, number>>((m, r) => ((m[r.origem] = (m[r.origem] ?? 0) + 1), m), {});
  console.log("ConteudoRevisao:", revisao.length, JSON.stringify(porOrigem));

  console.log("\n== Simulados reais com erros registrados");
  for (const s of reais.filter((x) => x.resultados.some((r) => r.conteudosErrados.length > 0))) {
    const n = s.resultados.reduce((a, r) => a + r.conteudosErrados.length, 0);
    console.log(" ", s.data.toISOString().slice(0, 10), s.prova.slug.padEnd(14), (s.nome ?? "(sem nome)").slice(0, 52), `| ${n} erros`);
  }

  const plano = await planejarSincronizacao();
  console.log(`\n== Simulação da sincronização (nada é gravado)`);
  console.log("assuntos distintos nos simulados:", plano.grupos.size);
  console.log("criaria:", plano.novos.length, "| atualizaria:", plano.atualizacoes.length, "| removeria:", plano.remover.length);
  for (const n of plano.novos) {
    const g = plano.grupos.get(n.assuntoNorm)!;
    console.log("  criar     " + linhaGrupo(g).trim());
  }
  for (const a of plano.atualizacoes) console.log(`  atualizar ${a.assunto}: ${JSON.stringify(a.data)}`);
  for (const r of plano.remover) console.log(`  remover   ${r.assunto}`);

  console.log("\n== Itens hoje em ConteudoRevisao");
  for (const r of revisao) console.log(`   ${r.origem.padEnd(8)} ${r.status.padEnd(9)} ${r.prioridade.padEnd(5)} ${r.disciplina.padEnd(10)} | ${r.assunto.slice(0, 70)}`);
}

async function main() {
  const i = process.argv.indexOf("--site");
  if (i !== -1 && process.argv[i + 1]) await diagnosticoDoSite(process.argv[i + 1]);
  else await diagnosticoDoEnv();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
