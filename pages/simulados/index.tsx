import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RegistrarSimuladoForm, { textoRevisao, type ResultadoRevisao } from "@/components/RegistrarSimuladoForm";

type Simulado = {
  id: string;
  nome: string | null;
  data: string;
  prova: { nome: string; slug: string };
  resultados: { acertos: number; totalQuestoes: number }[];
};

type ResultadoImport = {
  simuladosCriados: number;
  erros: string[];
  revisao?: ResultadoRevisao | null;
  revisaoFalhou?: boolean;
};

export default function ListaSimulados() {
  const [simulados, setSimulados] = useState<Simulado[] | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<ResultadoImport | null>(null);
  const [erroImport, setErroImport] = useState<string | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [avisoRevisao, setAvisoRevisao] = useState<string | null>(null);

  const [ocupadoFicticio, setOcupadoFicticio] = useState(false);
  const [msgFicticio, setMsgFicticio] = useState<string | null>(null);

  async function acaoFicticios(acao: "carregar" | "limpar") {
    if (
      acao === "limpar" &&
      !window.confirm("Apagar todos os simulados marcados como [dados fictícios]?")
    )
      return;
    setOcupadoFicticio(true);
    setMsgFicticio(null);
    try {
      const res = await fetch("/api/seed-ficticio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsgFicticio(`Erro: ${d.error || res.status}`);
      } else if (acao === "limpar") {
        setMsgFicticio(`${d.apagados} simulado(s) fictício(s) apagado(s).`);
      } else {
        const total = Object.values(d.criados as Record<string, number>).reduce((a, b) => a + b, 0);
        const avisos = (d.avisos as string[]).length ? ` Avisos: ${(d.avisos as string[]).join(" ")}` : "";
        setMsgFicticio(`${total} simulado(s) fictício(s) criado(s).${avisos}`);
      }
      carregarSimulados();
    } catch {
      setMsgFicticio("Erro de rede ao chamar o servidor.");
    } finally {
      setOcupadoFicticio(false);
    }
  }

  function carregarSimulados() {
    fetch("/api/simulados")
      .then((r) => r.json())
      .then(setSimulados);
  }

  useEffect(carregarSimulados, []);

  async function importarArquivo(arquivo: File) {
    setErroImport(null);
    setResultadoImport(null);
    setImportando(true);
    try {
      const texto = await arquivo.text();
      const res = await fetch("/api/simulados/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: texto }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroImport(dados.error || "Não foi possível importar o arquivo.");
      } else {
        setResultadoImport(dados);
        carregarSimulados();
      }
    } catch {
      setErroImport("Não foi possível ler o arquivo.");
    } finally {
      setImportando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function excluir(id: string) {
    const confirmar = window.confirm(
      "Excluir este simulado? Os resultados e conteúdos errados registrados nele também serão apagados. Essa ação não pode ser desfeita."
    );
    if (!confirmar) return;

    setExcluindoId(id);
    const res = await fetch(`/api/simulados/${id}`, { method: "DELETE" });
    setExcluindoId(null);

    if (res.ok || res.status === 404) {
      setSimulados((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    } else {
      alert("Não foi possível excluir o simulado. Tente novamente.");
    }
  }

  if (!simulados) return <p className="text-sm text-ink/60">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="font-display text-2xl font-semibold">Simulados registrados</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={importando}
            className="text-sm text-brand hover:underline disabled:opacity-50"
          >
            {importando ? "importando..." : "+ importar CSV"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) importarArquivo(arquivo);
            }}
          />
          <button
            onClick={() => acaoFicticios("carregar")}
            disabled={ocupadoFicticio}
            className="text-sm text-brand hover:underline disabled:opacity-50"
          >
            {ocupadoFicticio ? "aguarde..." : "+ dados fictícios"}
          </button>
          <button
            onClick={() => acaoFicticios("limpar")}
            disabled={ocupadoFicticio}
            className="text-sm text-ink/50 hover:underline disabled:opacity-50"
          >
            limpar fictícios
          </button>
          <button
            onClick={() => setMostrarFormulario((v) => !v)}
            className="text-sm text-brand hover:underline"
          >
            {mostrarFormulario ? "cancelar" : "+ registrar novo"}
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <RegistrarSimuladoForm
          onSalvo={(revisao) => {
            setMostrarFormulario(false);
            setAvisoRevisao(textoRevisao(revisao));
            carregarSimulados();
          }}
        />
      )}

      {msgFicticio && <p className="text-sm text-ink/70">{msgFicticio}</p>}

      {erroImport && <p className="text-sm text-warn">{erroImport}</p>}

      {avisoRevisao && (
        <p className="text-sm text-ink/70">
          {avisoRevisao}{" "}
          <Link href="/revisao" className="text-brand hover:underline">
            ver Revisão
          </Link>
        </p>
      )}

      {resultadoImport && (
        <div className="bg-accent/5 rounded-lg p-3 text-sm space-y-1.5">
          <p>
            <span className="font-medium text-brand">{resultadoImport.simuladosCriados}</span>{" "}
            simulado(s) importado(s) com sucesso.
          </p>
          {resultadoImport.simuladosCriados > 0 && (
            <p className={resultadoImport.revisaoFalhou ? "text-warn" : "text-ink/70"}>
              {textoRevisao(resultadoImport.revisao)}{" "}
              <Link href="/revisao" className="text-brand hover:underline">
                ver Revisão
              </Link>
            </p>
          )}
          {resultadoImport.erros.length > 0 && (
            <ul className="text-xs text-ink/60 list-disc pl-5 space-y-0.5">
              {resultadoImport.erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {simulados.length === 0 && (
        <p className="text-sm text-ink/50">Nenhum simulado registrado ainda.</p>
      )}

      <div className="space-y-2">
        {simulados.map((s) => {
          const totalAcertos = s.resultados.reduce((sum, r) => sum + r.acertos, 0);
          const totalQuestoes = s.resultados.reduce((sum, r) => sum + r.totalQuestoes, 0);
          return (
            <div
              key={s.id}
              className="bg-surface border border-ink/10 rounded-lg p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/provas/${s.prova.slug}`}
                    className="font-medium text-sm hover:text-brand"
                  >
                    {s.prova.nome}
                  </Link>
                  {s.nome && <span className="text-xs text-ink/40">— {s.nome}</span>}
                </div>
                <p className="text-xs text-ink/50 mt-1">
                  {new Date(s.data).toLocaleDateString("pt-BR")} · {totalAcertos}/{totalQuestoes}{" "}
                  acertos no total
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/simulados/${s.id}/export`}
                  className="text-sm border border-ink/15 rounded-md px-3 py-1.5 hover:border-accent hover:text-brand"
                >
                  Exportar CSV
                </a>
                <button
                  onClick={() => excluir(s.id)}
                  disabled={excluindoId === s.id}
                  className="text-sm border border-warn/30 text-warn rounded-md px-3 py-1.5 hover:bg-warn/10 disabled:opacity-50"
                >
                  {excluindoId === s.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
