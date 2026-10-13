import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Wifi, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "FAST Mobile — Configurações" },
      { name: "description", content: "Configure o IP e a porta do servidor FAST e a mesa do tablet de autoatendimento." },
      { property: "og:title", content: "FAST Mobile — Configurações" },
      { property: "og:description", content: "Conexão com o servidor FAST e configuração do tablet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const navigate = useNavigate();
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [form, setForm] = useState(config);
  const [testing, setTesting] = useState(false);
  useEffect(() => setForm(config), [config]);

  const test = async () => {
    if (form.demo) { toast.success("Modo demonstração: usando dados de exemplo"); return; }
    setTesting(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(`http://${form.host}:${form.port}/api/status`, { signal: ctrl.signal });
      clearTimeout(t);
      r.ok ? toast.success("Conectado ao servidor FAST") : toast.error(`Servidor respondeu com erro ${r.status}`);
    } catch {
      toast.error("Não foi possível conectar. Verifique IP, porta e se o Conector FAST está ativo.");
    } finally { setTesting(false); }
  };

  const save = () => { setConfig(form); toast.success("Configurações salvas"); };

  const input = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg";

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>

        {!unlocked ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <Lock className="h-8 w-8 text-primary" />
            <p className="mt-3 text-muted-foreground">Área protegida. Digite a senha do administrador (demo: {config.adminPin}).</p>
            <form onSubmit={(e) => { e.preventDefault(); pin === config.adminPin ? setUnlocked(true) : toast.error("Senha incorreta"); }} className="mt-4 flex gap-2">
              <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} className={input + " mt-0"} placeholder="Senha" />
              <button className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Entrar</button>
            </form>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Servidor FAST</h2>
              <label className="mt-4 flex items-center gap-3">
                <input type="checkbox" checked={form.demo} onChange={(e) => setForm({ ...form, demo: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
                Usar modo demonstração (sem servidor)
              </label>
              <div className={`mt-4 grid grid-cols-[1fr_8rem] gap-3 ${form.demo ? "opacity-50" : ""}`}>
                <label className="text-sm text-muted-foreground">IP do servidor
                  <input disabled={form.demo} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className={input} />
                </label>
                <label className="text-sm text-muted-foreground">Porta
                  <input disabled={form.demo} type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} className={input} />
                </label>
              </div>
              <button onClick={test} disabled={testing} className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 font-semibold">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />} Testar conexão
              </button>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Tablet de autoatendimento</h2>
              <label className="mt-4 block text-sm text-muted-foreground">Número da mesa deste tablet
                <input type="number" min={1} value={form.kioskTable ?? ""} onChange={(e) => setForm({ ...form, kioskTable: e.target.value ? Number(e.target.value) : null })} className={input} placeholder="Ex.: 12" />
              </label>
              <label className="mt-4 block text-sm text-muted-foreground">Senha do administrador
                <input value={form.adminPin} onChange={(e) => setForm({ ...form, adminPin: e.target.value })} className={input} />
              </label>
            </section>

            <button onClick={save} className="w-full rounded-xl bg-primary py-4 font-display text-lg font-bold text-primary-foreground">Salvar</button>
          </div>
        )}
      </div>
    </div>
  );
}
