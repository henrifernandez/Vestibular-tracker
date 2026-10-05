import { useEffect, useState } from "react";
import Link from "next/link";

type Resumo = { pendentes: number; revisados: number; total: number };

// Card do painel: quantos conteúdos ainda faltam revisar, linkando para /revisao.
export default function CardRevisao() {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    fetch("/api/revisao/resumo")
      .then((r) => (r.ok ? r.json() : null))
      .then(setResumo)
      .catch(() => setResumo(null));
  }, []);

  return (
    <Link
      href="/revisao"
      className="bg-surface rounded-xl border border-ink/10 p-4 hover:border-accent transition block"
    >
      <div className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Conteúdos a revisar</div>
      <div className="font-display text-2xl font-semibold mt-1">{resumo ? resumo.pendentes : "..."}</div>
      <div className="text-xs text-ink/50 mt-1">
        {!resumo
          ? "carregando..."
          : resumo.total === 0
            ? "nenhum conteúdo cadastrado ainda"
            : `${resumo.revisados} de ${resumo.total} já revisados`}
      </div>
    </Link>
  );
}
