import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Banknote, CreditCard, Minus, Plus, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore, lineTotal, tableItems } from "@/lib/store";
import { brl } from "@/lib/mock";

export const Route = createFileRoute("/conta/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Conta mesa ${params.id} — FAST Mobile` },
      { name: "description", content: "Feche a conta com taxa de serviço, divisão por pessoa e forma de pagamento." },
      { property: "og:title", content: `Conta mesa ${params.id} — FAST Mobile` },
      { property: "og:description", content: "Fechamento de conta na mesa." },
    ],
  }),
  component: Conta,
});

const methods = [
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
];

function Conta() {
  const id = Number(Route.useParams().id);
  const nav = useNavigate();
  const tickets = useStore((s) => s.tickets);
  const closeTable = useStore((s) => s.closeTable);
  const items = tableItems(tickets, id);
  const [service, setService] = useState(true);
  const [people, setPeople] = useState(1);
  const [method, setMethod] = useState("pix");

  const subtotal = items.reduce((a, i) => a + lineTotal(i), 0);
  const fee = service ? subtotal * 0.1 : 0;
  const total = subtotal + fee;

  const finish = () => {
    closeTable(id);
    toast.success(`Mesa ${id} paga via ${methods.find((m) => m.id === method)?.label} e liberada`);
    nav({ to: "/mesas" });
  };

  return (
    <AppShell title={`Conta · Mesa ${id}`} back={<Link to="/pedido/$id" params={{ id: String(id) }} className="shrink-0 rounded-lg p-1 hover:bg-secondary" aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></Link>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Consumo</h2>
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item lançado.</p>}
          <div className="divide-y divide-border">
            {items.map((i) => (
              <div key={i.uid} className="flex justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{i.qty}× {i.name}</span>
                  {i.addons.length > 0 && <div className="text-xs text-muted-foreground">+ {i.addons.join(", ")}</div>}
                </div>
                <span className="shrink-0">{brl(lineTotal(i))}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" checked={service} onChange={(e) => setService(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /> Taxa de serviço (10%)
              </span>
              <span>{brl(fee)}</span>
            </label>
            <div className="flex justify-between border-t border-border pt-2 font-display text-2xl font-bold"><span>Total</span><span>{brl(total)}</span></div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dividir por</h3>
            <div className="flex items-center justify-between rounded-xl bg-secondary p-2">
              <button onClick={() => setPeople(Math.max(1, people - 1))} className="flex h-10 w-10 items-center justify-center rounded-lg bg-background"><Minus className="h-4 w-4" /></button>
              <div className="text-center">
                <div className="font-semibold">{people} {people === 1 ? "pessoa" : "pessoas"}</div>
                <div className="text-xs text-muted-foreground">{brl(total / people)} cada</div>
              </div>
              <button onClick={() => setPeople(people + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-background"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium ${method === m.id ? "border-primary bg-primary/10" : "border-border"}`}>
                  <m.icon className="h-4 w-4" />{m.label}
                </button>
              ))}
            </div>
          </div>
          <button disabled={!items.length} onClick={finish}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground disabled:opacity-40">
            <CheckCircle2 className="h-5 w-5" /> Receber e liberar mesa
          </button>
          <p className="text-center text-xs text-muted-foreground">Pagamento simulado — na versão final emite NFC-e pelo FAST.</p>
        </section>
      </div>
    </AppShell>
  );
}
