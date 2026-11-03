import { beforeEach, describe, expect, it } from "vitest";
import { detalharErro } from "@/lib/error-diagnostics";
import { instalarCapturaGlobal, listarLogs } from "@/lib/logger";
import { reportLovableError } from "@/lib/lovable-error-reporting";

describe("E901 diagnostics", () => {
  beforeEach(() => localStorage.clear());

  it("preserves the original failure, source location, stack and cause", () => {
    const erro = new TypeError("Produto ausente", { cause: new Error("Catálogo incompleto") });
    erro.stack = "TypeError: Produto ausente\n at confirmar (pedido.js:42:7)";
    const detalhe = detalharErro(erro, { origem: "Navegador", arquivo: "pedido.js", linha: 42, coluna: 7 });
    expect(detalhe).toContain("TypeError: Produto ausente");
    expect(detalhe).toContain("Linha: 42 | Coluna: 7");
    expect(detalhe).toContain("at confirmar (pedido.js:42:7)");
    expect(detalhe).toContain("Causa encadeada: Error: Catálogo incompleto");
  });

  it("redacts secrets and excludes arbitrary object data", () => {
    const detalhe = detalharErro({ message: "senha=segredo token=privado https://fast.local/api?pin=1234", session: "session-private" }, { origem: "Teste" });
    for (const segredo of ["segredo", "privado", "1234", "session-private"]) expect(detalhe).not.toContain(segredo);
    expect(detalhe).toContain("[oculto]");
  });

  it("records execution and asynchronous errors in the daily log", () => {
    instalarCapturaGlobal();
    window.dispatchEvent(new ErrorEvent("error", { error: new ReferenceError("produto is not defined"), filename: "pedido.js", lineno: 15, colno: 3 }));
    const evento = new Event("unhandledrejection");
    Object.defineProperty(evento, "reason", { value: new Error("Falha de envio") });
    window.dispatchEvent(evento);
    const logs = listarLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.conteudo).toContain("[APLICACAO] [E901]");
    expect(logs[0]?.conteudo).toContain("Linha: 15 | Coluna: 3");
    expect(logs[0]?.conteudo).toContain("Falha de envio");
  });

  it("records errors handled by the screen boundary", () => {
    reportLovableError(new Error("Falha na tela"));
    expect(listarLogs()[0]?.conteudo).toContain("Falha na tela");
  });
});