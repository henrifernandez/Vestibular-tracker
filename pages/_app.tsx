import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/resumo", label: "Resumo semanal" },
  { href: "/simulados", label: "Simulados" },
  { href: "/simulados/novo", label: "Registrar simulado" },
  { href: "/simulados/importar", label: "Importar CSV" },
];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <div className={`min-h-screen font-sans ${display.variable} ${body.variable} ${mono.variable}`}>
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <Link href="/" className="font-display font-semibold text-xl tracking-tight text-ink">
            Monitor de Acertos
          </Link>
          <nav className="flex gap-1 text-sm flex-wrap">
            {NAV.map((item) => {
              const ativo = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "px-3 py-1.5 rounded-full transition " +
                    (ativo
                      ? "bg-accent text-white"
                      : "text-ink/60 hover:text-accent hover:bg-accent/5")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
