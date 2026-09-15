// Parser simples de CSV (sem dependências), compatível com o formato gerado
// pela exportação (campos entre aspas quando têm vírgula, aspas ou quebra de linha).

export function parseCSV(texto: string): string[][] {
  const semBOM = texto.replace(/^\uFEFF/, "");
  const linhas: string[][] = [];
  let campoAtual = "";
  let linhaAtual: string[] = [];
  let dentroDeAspas = false;

  for (let i = 0; i < semBOM.length; i++) {
    const char = semBOM[i];
    const proximo = semBOM[i + 1];

    if (dentroDeAspas) {
      if (char === '"' && proximo === '"') {
        campoAtual += '"';
        i++;
      } else if (char === '"') {
        dentroDeAspas = false;
      } else {
        campoAtual += char;
      }
      continue;
    }

    if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ",") {
      linhaAtual.push(campoAtual);
      campoAtual = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && proximo === "\n") i++;
      linhaAtual.push(campoAtual);
      campoAtual = "";
      linhas.push(linhaAtual);
      linhaAtual = [];
    } else {
      campoAtual += char;
    }
  }

  // última linha (se o arquivo não terminar com quebra de linha)
  if (campoAtual.length > 0 || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    linhas.push(linhaAtual);
  }

  return linhas.filter((l) => l.some((campo) => campo.trim() !== ""));
}
