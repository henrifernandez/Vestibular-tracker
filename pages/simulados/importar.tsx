import { useRef, useState } from "react";
import { useRouter } from "next/router";

type Resultado = { simuladosCriados: number; erros: string[] };

export default function ImportarSimulados() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  async function lidarComArquivo(arquivo: File) {
    setErroGeral(null);
    setResultado(null);
    setNomeArquivo(arquivo.name);
    setEnviando(true);

    try {
      const texto = await arquivo.text();
      const res = await fetch("/api/simulados/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: texto }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroGeral(dados.error || "Não foi possível importar o arquivo.");
      } else {
        setResultado(dados);
      }
    } catch {
      setErroGeral("Não foi possível ler o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar simulados</h1>
        <p className="text-sm text-ink/60 mt-1">
          Envie um arquivo CSV no mesmo formato gerado pela exportação (Prova, Simulado, Data,
          Área, Acertos, Total de questões, % de acertos, Conteúdos errados). Cada grupo de
          linhas com a mesma prova, data e nome de simulado vira um simulado só, com uma área
          por linha.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-ink/10 p-5 space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) lidarComArquivo(arquivo);
          }}
        />

        {enviando && <p className="text-sm text-ink/50">Importando {nomeArquivo}...</p>}

        {erroGeral && <p className="text-sm text-warn">{erroGeral}</p>}

        {resultado && (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium text-accent">{resultado.simuladosCriados}</span>{" "}
              simulado(s) importado(s) com sucesso.
            </p>
            {resultado.erros.length > 0 && (
              <div>
                <p className="text-sm text-warn font-medium mb-1">
                  {resultado.erros.length} linha(s) não puderam ser importadas:
                </p>
                <ul className="text-xs text-ink/60 list-disc pl-5 space-y-0.5">
                  {resultado.erros.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => router.push("/simulados")}
              className="mt-2 text-sm bg-accent text-white rounded-md px-4 py-2"
            >
              Ver simulados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
