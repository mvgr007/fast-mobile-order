import { toast } from "sonner";
import { detalharErro, type ErrorContext } from "./error-diagnostics";

/**
 * Registro de erros do FAST Mobile.
 * Navegadores não podem gravar em pastas do disco; por isso os arquivos
 * "Log/Log_YYYYMMDD.txt" ficam guardados no aparelho e podem ser baixados
 * na tela /logs. Na versão integrada, o Conector FAST grava a mesma pasta Log no servidor.
 */

export type LogCategoria = "REDE" | "NEGOCIO" | "HARDWARE" | "DADOS" | "OPERACIONAL" | "APLICACAO";

export interface LogTipo { codigo: string; categoria: LogCategoria; mensagem: string }

export const TIPOS_ERRO = {
  REDE_SEM_SINAL: { codigo: "E101", categoria: "REDE", mensagem: "Sem sinal de Wi-Fi com o computador central." },
  REDE_IP_ALTERADO: { codigo: "E102", categoria: "REDE", mensagem: "Servidor FAST não encontrado no IP configurado." },
  REDE_FIREWALL: { codigo: "E103", categoria: "REDE", mensagem: "Porta do Conector bloqueada (firewall)." },
  REDE_TIMEOUT: { codigo: "E104", categoria: "REDE", mensagem: "Servidor FAST demorou para responder." },
  REDE_CONECTOR_OFFLINE: { codigo: "E105", categoria: "REDE", mensagem: "Conector FAST está desligado." },
  REDE_CONTEUDO_MISTO: { codigo: "E106", categoria: "REDE", mensagem: "Página segura (HTTPS) não pode acessar o Conector FAST por HTTP. Ative HTTPS no Conector." },
  NEG_MESA_FECHADA: { codigo: "E201", categoria: "NEGOCIO", mensagem: "Mesa já fechada ou transferida no FAST." },
  NEG_PRODUTO_ESGOTADO: { codigo: "E202", categoria: "NEGOCIO", mensagem: "Produto esgotado ou inativo." },
  NEG_PEDIDO_DUPLICADO: { codigo: "E203", categoria: "NEGOCIO", mensagem: "Pedido duplicado bloqueado." },
  NEG_MESA_EM_FECHAMENTO: { codigo: "E204", categoria: "NEGOCIO", mensagem: "Mesa com conta solicitada não aceita novos itens." },
  NEG_OPERADOR_INVALIDO: { codigo: "E205", categoria: "NEGOCIO", mensagem: "Operador ou PIN inválido/revogado." },
  HW_IMPRESSORA: { codigo: "E301", categoria: "HARDWARE", mensagem: "Falha na impressora (desligada, sem papel ou porta ocupada)." },
  HW_ENERGIA: { codigo: "E302", categoria: "HARDWARE", mensagem: "Aparelho entrou em repouso e perdeu a conexão." },
  HW_MEMORIA: { codigo: "E303", categoria: "HARDWARE", mensagem: "Memória insuficiente no aparelho." },
  DADOS_ENCODING: { codigo: "E401", categoria: "DADOS", mensagem: "Texto com acentuação inválida recebido do FAST." },
  DADOS_ARREDONDAMENTO: { codigo: "E402", categoria: "DADOS", mensagem: "Diferença de centavos entre FAST Mobile e FAST." },
  DADOS_CAMPO_NULO: { codigo: "E403", categoria: "DADOS", mensagem: "Produto com dados incompletos no cadastro." },
  OP_MESA_ERRADA: { codigo: "E501", categoria: "OPERACIONAL", mensagem: "Tablet configurado para outra mesa." },
  OP_SAIDA_KIOSK: { codigo: "E502", categoria: "OPERACIONAL", mensagem: "Tentativa de sair do autoatendimento sem senha." },
  OP_SENHA_ADMIN: { codigo: "E503", categoria: "OPERACIONAL", mensagem: "Senha administrativa incorreta." },
  APP_INESPERADO: { codigo: "E901", categoria: "APLICACAO", mensagem: "Erro inesperado na aplicação." },
} satisfies Record<string, LogTipo>;

export type TipoErro = keyof typeof TIPOS_ERRO;

const PREFIXO = "fast-log:";
const pad = (n: number) => String(n).padStart(2, "0");

export function nomeArquivoLog(d = new Date()) {
  return `Log_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function formatarLinha(tipo: TipoErro, detalhe: string, d = new Date()) {
  const t = TIPOS_ERRO[tipo];
  const hora = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const rota = typeof window !== "undefined" ? window.location.pathname : "-";
  return `[${hora}] [${t.categoria}] [${t.codigo}] ${t.mensagem} | Tela: ${rota} | Detalhe: ${detalhe || "-"}`;
}

export function registrarErro(tipo: TipoErro, detalhe = "", opts: { silencioso?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const arquivo = nomeArquivoLog();
  try {
    const key = PREFIXO + arquivo;
    localStorage.setItem(key, (localStorage.getItem(key) ?? "") + formatarLinha(tipo, detalhe) + "\n");
  } catch { /* armazenamento cheio */ }
  if (!opts.silencioso) {
    toast.error(TIPOS_ERRO[tipo].mensagem, {
      description: `Código ${TIPOS_ERRO[tipo].codigo}. Para detalhes, consulte Log/${arquivo}.txt`,
    });
  }
}

export function listarLogs(): { arquivo: string; conteudo: string }[] {
  const out: { arquivo: string; conteudo: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIXO)) out.push({ arquivo: k.slice(PREFIXO.length), conteudo: localStorage.getItem(k) ?? "" });
  }
  return out.sort((a, b) => b.arquivo.localeCompare(a.arquivo));
}

export function baixarLog(arquivo: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${arquivo}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function apagarLog(arquivo: string) { localStorage.removeItem(PREFIXO + arquivo); }

let capturaInstalada = false;
export function registrarErroInesperado(error: unknown, context: ErrorContext) {
  registrarErro("APP_INESPERADO", detalharErro(error, context), { silencioso: true });
}

export function instalarCapturaGlobal() {
  if (capturaInstalada || typeof window === "undefined") return;
  capturaInstalada = true;
  window.addEventListener("error", (e) => registrarErroInesperado(e.error ?? e.message, {
    origem: "Erro de execução do navegador", arquivo: e.filename, linha: e.lineno, coluna: e.colno,
  }));
  window.addEventListener("unhandledrejection", (e) => registrarErroInesperado(e.reason, { origem: "Operação assíncrona não tratada" }));
  window.addEventListener("offline", () => registrarErro("REDE_SEM_SINAL", "Navegador ficou offline"));
}
