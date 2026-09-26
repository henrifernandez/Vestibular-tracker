// Estimativa de nota TRI por área a partir do número de acertos, calibrada com
// os microdados oficiais do ENEM 2025 (INEP) — mediana observada por número de
// acertos, uma curva por área (elas são bem diferentes: Matemática "estica"
// muito mais que Linguagens). O ponto em 0 acertos é o único que não vem da
// fonte (piso de "chute" estimado em 300).
// Fonte: https://alvoenem.com/quantos-acertos-enem (microdados ENEM 2025 / INEP)
// É uma estimativa — a TRI real depende de quais itens específicos você acerta,
// não só de quantos.
type Ponto = [acertos: number, tri: number];

export const TRI_TABELAS: Record<string, Ponto[]> = {
  Matemática: [[0, 300], [10, 440], [15, 561], [20, 649], [25, 711], [30, 768], [35, 830], [40, 909], [45, 980]],
  "Ciências da Natureza": [[0, 300], [10, 436], [15, 519], [20, 583], [25, 634], [30, 680], [35, 728], [40, 786], [45, 859]],
  "Ciências Humanas": [[0, 300], [10, 428], [15, 506], [20, 562], [25, 603], [30, 642], [35, 686], [40, 746], [45, 830]],
  Linguagens: [[0, 300], [10, 427], [15, 492], [20, 535], [25, 569], [30, 601], [35, 635], [40, 684], [45, 795]],
};

function interpolar(tabela: Ponto[], acertos: number): number {
  if (acertos <= tabela[0][0]) return tabela[0][1];
  for (let i = 1; i < tabela.length; i++) {
    const [a0, t0] = tabela[i - 1];
    const [a1, t1] = tabela[i];
    if (acertos <= a1) {
      const frac = (acertos - a0) / (a1 - a0);
      return Math.round(t0 + frac * (t1 - t0));
    }
  }
  return tabela[tabela.length - 1][1];
}

// Só vale pras 4 áreas objetivas do ENEM (Redação usa a nota real da correção
// por IA, não uma curva de acertos). Nomes de área de outras provas não batem
// com essas tabelas de propósito — aplicar a curva do ENEM numa prova diferente
// (Provão, Fuvest) não teria fundamento nenhum.
export function estimarTRI(nomeArea: string, acertos: number): number | null {
  const tabela = TRI_TABELAS[nomeArea];
  return tabela ? interpolar(tabela, acertos) : null;
}

export type Sensor = "vermelho" | "amarelo" | "verde" | "brilhante";

// vermelho: abaixo da meta por mais que a margem
// amarelo: abaixo da meta, mas dentro da margem
// verde: na meta, até meta + margem
// brilhante: passou da meta com folga (mais que a margem acima)
export function corSensor(valor: number, meta: number, margem: number): Sensor {
  if (valor < meta - margem) return "vermelho";
  if (valor < meta) return "amarelo";
  if (valor <= meta + margem) return "verde";
  return "brilhante";
}

export const SENSOR_DOT: Record<Sensor, string> = {
  vermelho: "bg-risco",
  amarelo: "bg-atencao",
  verde: "bg-good",
  brilhante: "bg-brilhante",
};

export const SENSOR_TEXT: Record<Sensor, string> = {
  vermelho: "text-risco",
  amarelo: "text-atencao",
  verde: "text-good",
  brilhante: "text-brilhante",
};

export const SENSOR_BAR: Record<Sensor, string> = {
  vermelho: "bg-risco",
  amarelo: "bg-atencao",
  verde: "bg-good",
  brilhante: "bg-brilhante",
};

// Margens da régua de cor: 4 questões pra métricas de acerto, 80 pontos numa
// escala TRI (0-1000) — escalado proporcionalmente pras escalas menores.
export const MARGEM_ACERTOS = 4;
export const MARGEM_TRI = 80;
export const MARGEM_REDACAO_20 = 2; // 80/1000 de 20
export const MARGEM_NOTA_FINAL_10 = 0.8; // 80/1000 de 10

// Estima a margem certa pra uma meta de nota quando não se sabe de antemão a
// escala (0-20, 0-1000 etc.) — mantém a mesma proporção de 8% (80/1000).
export function margemParaNota(notaAlvo: number): number {
  return Math.max(0.5, notaAlvo * 0.08);
}

// Pesos da nota final ponderada do ENEM-USP (NF): Matemática 3, Linguagens 2,
// Natureza 2, Redação 2, Humanas 1 — vem da própria descrição da prova.
export const PESOS_NF_USP: Record<string, number> = {
  Matemática: 3,
  Linguagens: 2,
  "Ciências da Natureza": 2,
  Redação: 2,
  "Ciências Humanas": 1,
};

export function mediaPonderada(valoresPorArea: Record<string, number | null>, pesos: Record<string, number>): number | null {
  let somaPeso = 0;
  let somaValor = 0;
  for (const [area, peso] of Object.entries(pesos)) {
    const v = valoresPorArea[area];
    if (v == null) continue;
    somaValor += v * peso;
    somaPeso += peso;
  }
  if (somaPeso === 0) return null;
  return Math.round(somaValor / somaPeso);
}

export function mediaSimples(valoresPorArea: Record<string, number | null>): number | null {
  const valores = Object.values(valoresPorArea).filter((v): v is number => v != null);
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}
