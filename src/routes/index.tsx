import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound, Tablet, Settings } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FAST Mobile — Escolha o modo" },
      { name: "description", content: "Escolha entre pedidos pelo garçom ou autoatendimento na mesa com o Insertsoft FAST Mobile." },
      { property: "og:title", content: "FAST Mobile — Escolha o modo" },
      { property: "og:description", content: "Modo garçom ou autoatendimento em tablet fixo na mesa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ModeChoice,
});

function ModeChoice() {
  const config = useStore((s) => s.config);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <span className="rounded-md bg-primary px-3 py-1 font-display text-sm font-bold tracking-widest text-primary-foreground">FAST</span>
          <h1 className="mt-4 font-display text-4xl font-bold">Mobile</h1>
          <p className="mt-2 text-muted-foreground">Como este aparelho será usado?</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/garcom" className="group rounded-2xl border border-border bg-card p-8 transition hover:border-primary hover:bg-primary/5">
            <UserRound className="h-12 w-12 text-primary" />
            <h2 className="mt-5 font-display text-2xl font-bold">Modo Garçom</h2>
            <p className="mt-2 text-muted-foreground">Login por PIN, mapa de mesas, lançamento de pedidos e fechamento de conta.</p>
          </Link>
          <Link to="/autoatendimento" className="group rounded-2xl border border-border bg-card p-8 transition hover:border-primary hover:bg-primary/5">
            <Tablet className="h-12 w-12 text-primary" />
            <h2 className="mt-5 font-display text-2xl font-bold">Autoatendimento</h2>
            <p className="mt-2 text-muted-foreground">Tablet fixo na mesa: o cliente pede, acompanha a conta e chama o garçom.</p>
            <p className="mt-3 text-sm font-medium text-primary">{config.kioskTable ? `Configurado: Mesa ${config.kioskTable}` : "Mesa ainda não configurada"}</p>
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${config.demo ? "bg-accent" : "bg-primary"}`} />
          {config.demo ? "Modo demonstração" : `Servidor FAST ${config.host}:${config.port}`}
          <Link to="/config" className="ml-2 flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-secondary"><Settings className="h-4 w-4" />Configurações</Link>
        </div>
      </div>
    </div>
  );
}
