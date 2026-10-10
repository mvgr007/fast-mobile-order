import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Plus, Receipt, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, tableTotal, type TableStatus } from "@/lib/store";
import { brl, minutesSince } from "@/lib/mock";

export const Route = createFileRoute("/mesas")({
  head: () => ({
    meta: [
      { title: "Mapa de mesas — FAST Mobile" },
      { name: "description", content: "Veja mesas livres, ocupadas e aguardando conta em tempo real." },
      { property: "og:title", content: "Mapa de mesas — FAST Mobile" },
      { property: "og:description", content: "Status de todas as mesas do salão." },
    ],
  }),
  component: Mesas,
});

const label: Record<TableStatus, string> = { livre: "Livre", ocupada: "Ocupada", conta: "Pediu conta" };
const style: Record<TableStatus, string> = {
  livre: "border-border bg-card",
  ocupada: "border-primary/60 bg-primary/10",
  conta: "border-warning/70 bg-warning/15",
};
const dot: Record<TableStatus, string> = { livre: "bg-success", ocupada: "bg-primary", conta: "bg-warning" };

function Mesas() {
  const tables = useStore((s) => s.tables);
  const tickets = useStore((s) => s.tickets);
  const reset = useStore((s) => s.reset);
  const [filter, setFilter] = useState<TableStatus | "todas">("todas");
  const list = tables.filter((t) => filter === "todas" || t.status === filter);
  const count = (s: TableStatus) => tables.filter((t) => t.status === s).length;

  return (
    <AppShell title="Mesas">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["todas", "livre", "ocupada", "conta"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm ${filter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
            {f === "todas" ? `Todas (${tables.length})` : `${label[f]} (${count(f)})`}
          </button>
        ))}
        <button onClick={() => confirm("Restaurar dados de demonstração?") && reset()} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Reiniciar demo
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((t) => {
          const total = tableTotal(tickets, t.id);
          const head = (
            <div className="flex items-start justify-between">
              <span className="font-display text-3xl font-bold">{String(t.id).padStart(2, "0")}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dot[t.status]}`} />{label[t.status]}
              </span>
            </div>
          );
          if (t.status === "livre") {
            return (
              <Link key={t.id} to="/pedido/$id" params={{ id: String(t.id) }}
                className={`flex aspect-[4/3] flex-col justify-between rounded-2xl border-2 p-4 transition active:scale-[0.98] ${style[t.status]}`}>
                {head}
                <div className="text-xs text-muted-foreground">Toque para abrir</div>
              </Link>
            );
          }
          return (
            <div key={t.id} className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${style[t.status]}`}>
              {head}
              <div className="text-sm">
                <div className="font-semibold">{brl(total)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{minutesSince(t.openedAt)} min · {t.waiter}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/pedido/$id" params={{ id: String(t.id) }}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg bg-secondary text-xs font-semibold active:scale-95">
                  <Plus className="h-4 w-4" /> Pedido
                </Link>
                <Link to="/conta/$id" params={{ id: String(t.id) }}
                  className="flex h-10 items-center justify-center gap-1 rounded-lg bg-primary text-xs font-semibold text-primary-foreground active:scale-95">
                  <Receipt className="h-4 w-4" /> Ver conta
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
