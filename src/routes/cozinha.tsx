import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, type Ticket } from "@/lib/store";
import { minutesSince, type Sector } from "@/lib/mock";

export const Route = createFileRoute("/cozinha")({
  head: () => ({
    meta: [
      { title: "Painel da cozinha — FAST Mobile" },
      { name: "description", content: "Pedidos chegando por setor: cozinha e bar, com status de preparo." },
      { property: "og:title", content: "Painel da cozinha — FAST Mobile" },
      { property: "og:description", content: "Acompanhe a produção dos pedidos." },
    ],
  }),
  component: Cozinha,
});

const cols: { key: Ticket["status"]; label: string; next?: Ticket["status"]; action?: string }[] = [
  { key: "novo", label: "Novos", next: "preparando", action: "Iniciar preparo" },
  { key: "preparando", label: "Preparando", next: "pronto", action: "Marcar pronto" },
  { key: "pronto", label: "Prontos" },
];

function Cozinha() {
  const tickets = useStore((s) => s.tickets);
  const setTicket = useStore((s) => s.setTicket);
  const [sector, setSector] = useState<Sector | "todos">("todos");
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000);
    const onStorage = () => useStore.persist.rehydrate();
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(t); window.removeEventListener("storage", onStorage); };
  }, []);
  const list = tickets.filter((t) => sector === "todos" || t.sector === sector).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <AppShell title="Produção" exigeGarcom={false}>
      <div className="mb-5 flex gap-2">
        {(["todos", "cozinha", "bar"] as const).map((s) => (
          <button key={s} onClick={() => setSector(s)}
            className={`rounded-full px-4 py-2 text-sm capitalize ${sector === s ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>{s}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cols.map((c) => {
          const items = list.filter((t) => t.status === c.key);
          return (
            <div key={c.key} className="rounded-2xl bg-secondary/50 p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 font-display font-semibold">{c.label}<span className="rounded-full bg-background px-2 text-sm">{items.length}</span></h2>
              <div className="space-y-3">
                {items.map((t) => {
                  const m = minutesSince(t.createdAt);
                  return (
                    <div key={t.id} className={`rounded-xl border bg-card p-4 ${c.key === "novo" ? "border-primary" : "border-border"}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-display text-xl font-bold">Mesa {t.tableId}</span>
                        <span className={`flex items-center gap-1 text-xs ${m > 20 && c.key !== "pronto" ? "text-destructive" : "text-muted-foreground"}`}><Clock className="h-3 w-3" />{m} min</span>
                      </div>
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">{t.sector} · {t.waiter}</div>
                      <ul className="space-y-1 text-sm">
                        {t.items.map((i) => (
                          <li key={i.uid}>
                            <span className="font-semibold">{i.qty}×</span> {i.name}
                            {i.addons.length > 0 && <div className="pl-5 text-xs text-muted-foreground">+ {i.addons.join(", ")}</div>}
                            {i.notes && <div className="pl-5 text-xs italic text-warning">{i.notes}</div>}
                          </li>
                        ))}
                      </ul>
                      {c.next && (
                        <button onClick={() => setTicket(t.id, c.next!)} className="mt-3 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground">{c.action}</button>
                      )}
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 text-sm text-muted-foreground">Nada aqui.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
