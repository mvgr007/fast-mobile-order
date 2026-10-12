import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Delete } from "lucide-react";
import { waiters } from "@/lib/mock";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/garcom")({
  head: () => ({
    meta: [
      { title: "FAST Mobile — Login do garçom" },
      { name: "description", content: "Protótipo do Insertsoft FAST Mobile para tirar pedidos na mesa pelo tablet ou celular." },
      { property: "og:title", content: "FAST Mobile — Login do garçom" },
      { property: "og:description", content: "Pedidos na mesa pelo navegador do tablet ou celular." },
    ],
  }),
  component: Login,
});

function Login() {
  const [sel, setSel] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const login = useStore((s) => s.login);
  const nav = useNavigate();
  const w = waiters.find((x) => x.id === sel);

  const press = (d: string) => {
    setErr(false);
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4 && w) {
      if (next === w.pin) { login(w.name); nav({ to: "/mesas" }); }
      else { setErr(true); setPin(""); }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="rounded-md bg-primary px-3 py-1 font-display text-sm font-bold tracking-widest text-primary-foreground">FAST</span>
          <h1 className="mt-4 font-display text-3xl font-bold">Mobile</h1>
          <p className="mt-1 text-muted-foreground">Quem está atendendo?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {waiters.map((x) => (
            <button key={x.id} onClick={() => { setSel(x.id); setPin(""); setErr(false); }}
              className={`rounded-xl border p-4 text-left transition ${sel === x.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary"}`}>
              <div className="font-display text-lg font-semibold">{x.name}</div>
              <div className="text-xs text-muted-foreground">PIN demo: {x.pin}</div>
            </button>
          ))}
        </div>
        {w && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            {err && <p className="mb-3 text-center text-sm text-destructive">PIN incorreto</p>}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0"].map((d, i) =>
                d ? (
                  <button key={i} onClick={() => press(d)} className="h-14 rounded-xl bg-secondary font-display text-xl font-semibold active:scale-95">{d}</button>
                ) : <span key={i} />,
              )}
              <button onClick={() => setPin(pin.slice(0, -1))} className="flex h-14 items-center justify-center rounded-xl bg-secondary" aria-label="Apagar"><Delete className="h-5 w-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
