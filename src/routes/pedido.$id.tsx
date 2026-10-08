import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, Send, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore, lineTotal, tableItems } from "@/lib/store";
import { brl, categories, products, type Product } from "@/lib/mock";

export const Route = createFileRoute("/pedido/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Pedido mesa ${params.id} — FAST Mobile` },
      { name: "description", content: "Cardápio com adicionais e observações para lançar pedidos na mesa." },
      { property: "og:title", content: `Pedido mesa ${params.id} — FAST Mobile` },
      { property: "og:description", content: "Lance pedidos direto da mesa." },
    ],
  }),
  component: Pedido,
});

function Pedido() {
  const id = Number(Route.useParams().id);
  const nav = useNavigate();
  const cart = useStore((s) => s.carts[id]) ?? [];
  const tickets = useStore((s) => s.tickets);
  const { addToCart, changeQty, sendOrder, requestBill } = useStore();
  const [cat, setCat] = useState(categories[0]);
  const [q, setQ] = useState("");
  const [picking, setPicking] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const list = useMemo(
    () => products.filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : p.category === cat)),
    [cat, q],
  );
  const consumed = tableItems(tickets, id);
  const cartTotal = cart.reduce((a, i) => a + lineTotal(i), 0);
  const cartQty = cart.reduce((a, i) => a + i.qty, 0);

  const send = () => {
    sendOrder(id);
    setCartOpen(false);
    toast.success(`Pedido da mesa ${id} enviado para produção`);
  };

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">Mesa {id} · novo pedido</h2>
        <button className="lg:hidden" onClick={() => setCartOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {cart.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item. Toque nos produtos para adicionar.</p>}
        {cart.map((i) => (
          <div key={i.uid} className="rounded-xl bg-secondary p-3">
            <div className="flex justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{i.name}</div>
                {i.addons.length > 0 && <div className="text-xs text-muted-foreground">+ {i.addons.join(", ")}</div>}
                {i.notes && <div className="text-xs italic text-warning">"{i.notes}"</div>}
              </div>
              <div className="shrink-0 font-semibold">{brl(lineTotal(i))}</div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => changeQty(id, i.uid, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-background"><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center font-semibold">{i.qty}</span>
              <button onClick={() => changeQty(id, i.uid, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-background"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {consumed.length > 0 && (
          <div className="pt-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Já lançado na mesa</h3>
            {consumed.map((i) => (
              <div key={i.uid} className="flex justify-between py-1 text-sm text-muted-foreground">
                <span>{i.qty}× {i.name}</span><span>{brl(lineTotal(i))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-border p-4">
        <button disabled={!cart.length} onClick={send}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground disabled:opacity-40">
          <Send className="h-5 w-5" /> Enviar {cart.length > 0 && `· ${brl(cartTotal)}`}
        </button>
        {consumed.length > 0 && (
          <button onClick={() => { requestBill(id); nav({ to: "/conta/$id", params: { id: String(id) } }); }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border font-medium">
            <Receipt className="h-4 w-4" /> Fechar conta
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AppShell title={`Mesa ${id}`} back={<Link to="/mesas" className="shrink-0 rounded-lg p-1 hover:bg-secondary" aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></Link>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..."
              className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-3 outline-none focus:border-primary" />
          </div>
          {!q && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <button key={p.id} onClick={() => setPicking(p)} className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary active:scale-[0.98]">
                <div className="font-display text-base font-semibold">{p.name}</div>
                {p.desc && <div className="mt-0.5 text-xs text-muted-foreground">{p.desc}</div>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-primary">{brl(p.price)}</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p.sector}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <aside className="hidden h-[calc(100vh-110px)] rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:block">{cartPanel}</aside>
      </div>

      {cartQty > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex h-14 items-center justify-between rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg lg:hidden">
          <span>{cartQty} {cartQty === 1 ? "item" : "itens"}</span><span>Ver pedido · {brl(cartTotal)}</span>
        </button>
      )}
      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-background/70 lg:hidden" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-2xl border-t border-border bg-card" onClick={(e) => e.stopPropagation()}>{cartPanel}</div>
        </div>
      )}
      {picking && <ProductSheet p={picking} onClose={() => setPicking(null)} onAdd={(item) => { addToCart(id, item); setPicking(null); toast(`${item.qty}× ${item.name} adicionado`); }} />}
    </AppShell>
  );
}

function ProductSheet({ p, onClose, onAdd }: { p: Product; onClose: () => void; onAdd: (i: { productId: string; name: string; qty: number; unit: number; addons: string[]; notes: string }) => void }) {
  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const unit = p.price + (p.addons ?? []).filter((a) => addons.includes(a.name)).reduce((s, a) => s + a.price, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><h3 className="font-display text-xl font-bold">{p.name}</h3>{p.desc && <p className="text-sm text-muted-foreground">{p.desc}</p>}</div>
          <button onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        {p.addons && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionais</h4>
            <div className="space-y-2">
              {p.addons.map((a) => {
                const on = addons.includes(a.name);
                return (
                  <button key={a.name} onClick={() => setAddons(on ? addons.filter((x) => x !== a.name) : [...addons, a.name])}
                    className={`flex w-full justify-between rounded-xl border p-3 text-sm ${on ? "border-primary bg-primary/10" : "border-border"}`}>
                    <span>{a.name}</span><span>+ {brl(a.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observação</h4>
          <div className="mb-2 flex flex-wrap gap-2">
            {["Sem cebola", "Bem passado", "Sem gelo", "Pouco sal"].map((s) => (
              <button key={s} onClick={() => setNotes(notes ? `${notes}, ${s.toLowerCase()}` : s)} className="rounded-full bg-secondary px-3 py-1 text-xs">{s}</button>
            ))}
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: sem tomate" className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-display text-lg font-semibold">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"><Plus className="h-4 w-4" /></button>
          </div>
          <button onClick={() => onAdd({ productId: p.id, name: p.name, qty, unit, addons, notes })}
            className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground">Adicionar · {brl(unit * qty)}</button>
        </div>
      </div>
    </div>
  );
}
