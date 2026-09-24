// A área de Redação não tem "acertos" de verdade (é um texto avaliado por nota,
// não questões objetivas). Por isso ela precisa de tratamento especial em qualquer
// lugar que calcule progresso ou monte gráfico a partir de acertos/totalQuestoes.
export function ehRedacao(nomeArea: string): boolean {
  return nomeArea.trim().toLowerCase() === "redação";
}
