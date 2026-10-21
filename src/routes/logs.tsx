import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Trash2, FlaskConical } from "lucide-react";
import { apagarLog, baixarLog, listarLogs, registrarErro, TIPOS_ERRO, type TipoErro } from "@/lib/logger";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "FAST Mobile — Arquivos de log" },
      { name: "description", content: "Consulte e baixe os arquivos de log de erro diários do FAST Mobile." },
      { property: "og:title", content: "FAST Mobile — Arquivos de log" },
      { property: "og:description", content: "Logs de erro diários (Log_YYYYMMDD)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const [logs, setLogs] = useState<{ arquivo: string; conteudo: string }[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const recarregar = () => setLogs(listarLogs());
  useEffect(recarregar, []);

  const simular = () => {
    (Object.keys(TIPOS_ERRO) as TipoErro[]).forEach((t) => registrarErro(t, "Simulação de teste", { silencioso: true }));
    registrarErro("APP_INESPERADO", "Simulação concluída: todos os tipos registrados");
    recarregar();
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to="/config" className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        <h1 className="font-display text-3xl font-bold">Pasta Log</h1>
        <p className="mt-2 text-sm text-muted-foreground">Um arquivo por dia (Log_AAAAMMDD), criado quando ocorre um erro.</p>
        <button onClick={simular} className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 font-semibold"><FlaskConical className="h-4 w-4" />Simular todos os tipos de erro</button>

        <div className="mt-6 space-y-3">
          {logs.length === 0 && <p className="text-muted-foreground">Nenhum erro registrado.</p>}
          {logs.map((l) => (
            <div key={l.arquivo} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <button onClick={() => setAberto(aberto === l.arquivo ? null : l.arquivo)} className="flex-1 text-left font-semibold">{l.arquivo}.txt <span className="text-sm font-normal text-muted-foreground">({l.conteudo.trim().split("\n").length} registros)</span></button>
                <button aria-label="Baixar" onClick={() => baixarLog(l.arquivo, l.conteudo)} className="rounded-lg p-2 hover:bg-secondary"><Download className="h-4 w-4" /></button>
                <button aria-label="Apagar" onClick={() => { apagarLog(l.arquivo); recarregar(); }} className="rounded-lg p-2 hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
              </div>
              {aberto === l.arquivo && <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-background p-3 text-xs">{l.conteudo}</pre>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
