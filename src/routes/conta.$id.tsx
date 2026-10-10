import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Banknote, CreditCard, Minus, Plus, QrCode, CheckCircle2, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore, lineTotal, tableItems, type LineItem } from "@/lib/store";
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

  const [preview, setPreview] = useState(false);
  const waiter = useStore((s) => s.tables.find((t) => t.id === id)?.waiter);
  const receipt = buildReceipt({ id, items, subtotal, fee, total, people, waiter });

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
          <button disabled={!items.length} onClick={() => setPreview(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border font-medium disabled:opacity-40">
            <Printer className="h-4 w-4" /> Imprimir pré-conta (cupom 40 col.)
          </button>
          <button disabled={!items.length} onClick={finish}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground disabled:opacity-40">
            <CheckCircle2 className="h-5 w-5" /> Receber e liberar mesa
          </button>
          <p className="text-center text-xs text-muted-foreground">Pagamento simulado — na versão final emite NFC-e pelo FAST.</p>
        </section>
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 print:static print:bg-transparent print:p-0" onClick={() => setPreview(false)}>
          <div className="max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card p-4 print:max-h-none print:border-0 print:p-0" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between print:hidden">
              <h3 className="font-display font-semibold">Pré-conta · Mesa {id}</h3>
              <button onClick={() => setPreview(false)} aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>
            <pre id="cupom" className="rounded-md bg-foreground p-3 font-mono text-[12px] leading-tight text-background print:bg-transparent print:p-0 print:text-black">{receipt}</pre>
            <button onClick={() => { window.print(); toast.success("Pré-conta enviada para impressão"); }}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground print:hidden">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const W = 40;
const center = (t: string) => t.slice(0, W).padStart(Math.floor((W + Math.min(t.length, W)) / 2)).padEnd(W);
const lr = (l: string, r: string) => { const room = W - r.length - 1; return (l.length > room ? l.slice(0, room) : l).padEnd(room) + " " + r; };
const money = (v: number) => v.toFixed(2).replace(".", ",");

function buildReceipt({ id, items, subtotal, fee, total, people, waiter }: { id: number; items: LineItem[]; subtotal: number; fee: number; total: number; people: number; waiter?: string }) {
  const line = "-".repeat(W);
  const d = new Date();
  const out = [
    center("RESTAURANTE DEMONSTRACAO"),
    center("CNPJ 00.000.000/0001-00"),
    line,
    center("*** PRE-CONTA - MESA " + String(id).padStart(2, "0") + " ***"),
    center("NAO E DOCUMENTO FISCAL"),
    line,
    lr(`Data: ${d.toLocaleDateString("pt-BR")}`, d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })),
    `Garcom: ${waiter ?? "-"}`,
    line,
    lr("QTD ITEM", "TOTAL"),
  ];
  items.forEach((i) => {
    out.push(lr(`${i.qty}x ${i.name}`, money(lineTotal(i))));
    i.addons.forEach((a) => out.push(`   + ${a}`.slice(0, W)));
    if (i.notes) out.push(`   Obs: ${i.notes}`.slice(0, W));
  });
  out.push(line, lr("Subtotal", money(subtotal)), lr("Taxa de servico (10%)", money(fee)), lr("TOTAL R$", money(total)));
  if (people > 1) out.push(lr(`Dividido por ${people} pessoas`, money(total / people)));
  out.push(line, center("Obrigado pela preferencia!"), center("FAST Mobile - Insertsoft"));
  return out.join("\n");
}
