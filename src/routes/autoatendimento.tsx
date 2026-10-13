import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Bell, Receipt, ShoppingCart, Minus, Plus, Settings, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { categories, products, brl, type Product } from "@/lib/mock";
import { useStore, tableItems, tableTotal, lineTotal } from "@/lib/store";

export const Route = createFileRoute("/autoatendimento")({
  head: () => ({
    meta: [
      { title: "FAST Mobile — Autoatendimento" },
      { name: "description", content: "Faça seu pedido pelo tablet da mesa, acompanhe a conta e chame o garçom." },
      { property: "og:title", content: "FAST Mobile — Autoatendimento" },
      { property: "og:description", content: "Cardápio digital no tablet da mesa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kiosk,
});

function Kiosk() {
  const table = useStore((s) => s.config.kioskTable);
  const adminPin = useStore((s) => s.config.adminPin);
  const carts = useStore((s) => s.carts);
  const tickets = useStore((s) => s.tickets);
  const { addToCart, changeQty, sendOrder, requestBill, login } = useStore.getState();
  const [cat, setCat] = useState(categories[0]);
  const [panel, setPanel] = useState<null | "cart" | "bill">(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitPin, setExitPin] = useState("");
  const [pick, setPick] = useState<Product | null>(null);
  const [pickQty, setPickQty] = useState(1);
  const [step, setStep] = useState<null | "confirm" | "more">(null);
  const nav = useNavigate();

  if (!table) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center text-foreground">
        <div className="max-w-sm">
          <Settings className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Tablet não configurado</h1>
          <p className="mt-2 text-muted-foreground">Informe o número da mesa deste tablet nas configurações.</p>
          <Link to="/config" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">Abrir configurações</Link>
        </div>
      </div>
    );
  }

  const cart = carts[table] ?? [];
  const cartTotal = cart.reduce((a, i) => a + lineTotal(i), 0);
  const sent = tableItems(tickets, table);
  const send = () => {
    login("Autoatendimento");
    sendOrder(table);
    useStore.getState().logout();
    setPanel(null);
    toast.success("Pedido enviado! Em breve o garçom trará até você.");
  };

  const confirmExit = (e: FormEvent) => {
    e.preventDefault();
    if (exitPin !== adminPin) { toast.error("Senha incorreta"); setExitPin(""); return; }
    setExitOpen(false);
    toast.success("Autoatendimento encerrado.");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      {exitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <form onSubmit={confirmExit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
            <LogOut className="h-10 w-10 text-primary" />
            <h2 className="mt-3 font-display text-2xl font-bold">Encerrar autoatendimento</h2>
            <p className="mt-2 text-sm text-muted-foreground">Digite a senha do gerente ou administrador cadastrado no FAST (demo: {adminPin}).</p>
            <input type="password" inputMode="numeric" autoFocus value={exitPin} onChange={(e) => setExitPin(e.target.value)} placeholder="Senha" className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setExitOpen(false)} className="rounded-xl bg-secondary py-3 font-semibold">Cancelar</button>
              <button type="submit" disabled={!exitPin} className="rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">Confirmar</button>
            </div>
          </form>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-primary px-2 py-1 font-display text-xs font-bold tracking-wider text-primary-foreground">FAST</span>
            <h1 className="font-display text-xl font-bold">Mesa {table}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPanel("cart")} className="relative flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-semibold" aria-label="Carrinho"><ShoppingCart className="h-5 w-5" /><span className="hidden sm:inline">Carrinho</span>{cart.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{cart.reduce((a, i) => a + i.qty, 0)}</span>}</button>
            <button onClick={() => toast.success("Garçom chamado! Ele já está a caminho.")} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-semibold"><Bell className="h-5 w-5" /><span className="hidden sm:inline">Chamar garçom</span></button>
            <button onClick={() => setPanel("bill")} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-semibold"><Receipt className="h-5 w-5" /><span className="hidden sm:inline">Minha conta</span></button>
            <button onClick={() => { setExitPin(""); setExitOpen(true); }} className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-semibold text-muted-foreground" aria-label="Sair"><LogOut className="h-5 w-5" /><span className="hidden sm:inline">Sair</span></button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-5 py-2 font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c}</button>
          ))}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.filter((p) => p.category === cat).map((p) => (
          <button key={p.id} onClick={() => { setPick(p); setPickQty(1); setStep("confirm"); }}
            className="overflow-hidden rounded-2xl border border-border bg-card text-left transition active:scale-[0.98]">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-secondary font-display text-2xl text-muted-foreground">{p.category}</div>}
            <div className="p-4">
              <div className="font-display text-lg font-semibold">{p.name}</div>
              {p.desc && <div className="text-sm text-muted-foreground">{p.desc}</div>}
              <div className="mt-2 flex items-center justify-between"><span className="font-display text-xl font-bold text-primary">{brl(p.price)}</span><Plus className="h-6 w-6 rounded-full bg-primary p-1 text-primary-foreground" /></div>
            </div>
          </button>
        ))}
      </main>

      {pick && step && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            {step === "confirm" ? (
              <>
                <h2 className="font-display text-xl font-bold">Confirma o lançamento do produto {pick.name} na quantidade {pickQty}?</h2>
                <div className="mt-5 flex items-center justify-center gap-5">
                  <button onClick={() => setPickQty(Math.max(1, pickQty - 1))} className="rounded-xl bg-secondary p-3" aria-label="Diminuir"><Minus className="h-5 w-5" /></button>
                  <span className="w-10 font-display text-3xl font-bold">{pickQty}</span>
                  <button onClick={() => setPickQty(pickQty + 1)} className="rounded-xl bg-secondary p-3" aria-label="Aumentar"><Plus className="h-5 w-5" /></button>
                </div>
                <p className="mt-3 font-display text-lg font-semibold text-primary">{brl(pick.price * pickQty)}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={() => { setPick(null); setStep(null); }} className="rounded-xl bg-secondary py-3 font-semibold">Não</button>
                  <button onClick={() => { addToCart(table, { productId: pick.id, name: pick.name, qty: pickQty, unit: pick.price, addons: [], notes: "" }); setStep("more"); }} className="rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Sim, confirmar</button>
                </div>
              </>
            ) : (
              <>
                <ShoppingCart className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 font-display text-xl font-bold">{pickQty}× {pick.name} foi para o carrinho.</h2>
                <p className="mt-2 text-muted-foreground">Deseja lançar mais itens?</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={() => { setPick(null); setStep(null); setPanel("cart"); }} className="rounded-xl bg-secondary py-3 font-semibold">Não</button>
                  <button onClick={() => { setPick(null); setStep(null); }} className="rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Sim</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <button onClick={() => setPanel("cart")} className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-primary px-6 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg">
          <span className="flex items-center gap-2 text-left"><ShoppingCart className="h-5 w-5 shrink-0" />{cart.reduce((a, i) => a + i.qty, 0)} no carrinho — toque para enviar ao preparo</span>
          <span>{brl(cartTotal)}</span>
        </button>
      )}

      {panel && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 sm:items-center" onClick={() => setPanel(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{panel === "cart" ? "Carrinho" : "Minha conta"}</h2>
              <button onClick={() => setPanel(null)} aria-label="Fechar"><X className="h-6 w-6" /></button>
            </div>
            {panel === "cart" ? (
              <>
                {cart.length === 0 && <p className="text-muted-foreground">Seu carrinho está vazio.</p>}
                {cart.map((i) => (
                  <div key={i.uid} className="flex items-center justify-between border-b border-border py-3">
                    <div><div className="font-semibold">{i.name}</div><div className="text-sm text-muted-foreground">{brl(i.unit)}</div></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => changeQty(table, i.uid, -1)} className="rounded-lg bg-secondary p-2"><Minus className="h-4 w-4" /></button>
                      <span className="w-6 text-center font-bold">{i.qty}</span>
                      <button onClick={() => changeQty(table, i.uid, 1)} className="rounded-lg bg-secondary p-2"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex justify-between font-display text-xl font-bold"><span>Total</span><span>{brl(cartTotal)}</span></div>
                <button onClick={send} disabled={!cart.length} className="mt-5 w-full rounded-xl bg-primary py-4 font-display text-lg font-bold text-primary-foreground disabled:opacity-50">Confirmar lançamento para preparo</button>
              </>
            ) : (
              <>
                {sent.length === 0 ? <p className="text-muted-foreground">Nenhum item pedido ainda.</p> : sent.map((i) => (
                  <div key={i.uid} className="flex justify-between border-b border-border py-2"><span>{i.qty}× {i.name}</span><span>{brl(lineTotal(i))}</span></div>
                ))}
                <div className="mt-4 flex justify-between font-display text-xl font-bold"><span>Total</span><span>{brl(tableTotal(tickets, table))}</span></div>
                <button onClick={() => { requestBill(table); setPanel(null); toast.success("Fechamento solicitado! O garçom trará sua conta."); }} disabled={!sent.length}
                  className="mt-5 w-full rounded-xl bg-primary py-4 font-display text-lg font-bold text-primary-foreground disabled:opacity-50">Pedir fechamento da conta</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
