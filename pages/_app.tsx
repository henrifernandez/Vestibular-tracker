import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight">
            Monitor de Acertos
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="hover:text-accent">
              Dashboard
            </Link>
            <Link href="/simulados" className="hover:text-accent">
              Simulados
            </Link>
            <Link href="/simulados/novo" className="hover:text-accent">
              Registrar simulado
            </Link>
            <Link href="/simulados/importar" className="hover:text-accent">
              Importar CSV
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
