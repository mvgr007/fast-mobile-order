export interface ErrorContext {
  origem: string;
  arquivo?: string;
  linha?: number;
  coluna?: number;
}

// Only diagnostic fields are collected: never serialize arbitrary request/session objects.
function textoSeguro(value: string): string {
  return value
    .replace(/\b(Bearer\s+)[\w.+/=-]+/gi, "$1[oculto]")
    .replace(/\b(password|senha|pin|token|access_token|refresh_token|authorization|apikey|api_key)\b(["']?\s*[:=]\s*["']?)[^\s,"';&]+/gi, "$1$2[oculto]")
    .replace(/(https?:\/\/[^\s?#]+)[?#][^\s)]+/gi, "$1[parâmetros ocultos]")
    .slice(0, 8000);
}

function possivelCausa(nome: string, mensagem: string): string {
  if (/chunkloaderror|loading chunk|dynamically imported module/i.test(`${nome} ${mensagem}`)) {
    return "Possível causa: atualização do aplicativo ou falha ao baixar um arquivo. Verifique a conexão e recarregue a tela.";
  }
  if (/quotaexceedederror/i.test(nome)) return "Possível causa: armazenamento do navegador cheio ou indisponível.";
  if (/failed to fetch|networkerror|load failed/i.test(mensagem)) return "Possível causa: conexão indisponível, servidor inacessível ou bloqueio do navegador. O log não confirma qual deles ocorreu.";
  if (nome === "TypeError") return "Possível causa: dado ausente, formato inesperado ou operação incompatível com o valor recebido.";
  if (nome === "ReferenceError") return "Possível causa: referência a uma variável ou função que não está disponível.";
  if (nome === "SyntaxError") return "Possível causa: código ou conteúdo recebido em formato inválido, por exemplo JSON malformado.";
  if (nome === "RangeError") return "Possível causa: valor fora do intervalo permitido ou chamadas repetidas em excesso.";
  return "Causa não determinada automaticamente. Analise a mensagem original e a pilha de execução; não há evidência suficiente para afirmar a causa.";
}

export function detalharErro(error: unknown, context: ErrorContext): string {
  const partes = [`Origem: ${context.origem}`];
  if (context.arquivo) partes.push(`Arquivo: ${context.arquivo} | Linha: ${context.linha ?? "não disponível"} | Coluna: ${context.coluna ?? "não disponível"}`);
  const vistos = new Set<unknown>();
  let atual = error;
  for (let nivel = 0; nivel < 5 && !vistos.has(atual); nivel++) {
    vistos.add(atual);
    const objeto = atual !== null && typeof atual === "object" ? atual as { name?: unknown; message?: unknown; stack?: unknown; cause?: unknown } : undefined;
    const nome = atual instanceof Error ? atual.name : typeof objeto?.name === "string" ? objeto.name : "Erro sem tipo informado";
    const mensagem = atual instanceof Error ? atual.message : typeof objeto?.message === "string" ? objeto.message : typeof atual === "string" ? atual : "Mensagem original não disponibilizada pelo navegador";
    partes.push(`${nivel === 0 ? "Falha original" : "Causa encadeada"}: ${nome}: ${mensagem}`);
    if (nivel === 0) partes.push(possivelCausa(nome, mensagem));
    const stack = atual instanceof Error ? atual.stack : objeto?.stack;
    partes.push(`Pilha de execução: ${typeof stack === "string" ? stack : "não disponível"}`);
    if (!objeto || objeto.cause == null) break;
    atual = objeto.cause;
  }
  if (typeof navigator !== "undefined") partes.push(`Conexão do navegador: ${navigator.onLine ? "online (não garante acesso ao FAST)" : "offline"} | Navegador: ${navigator.userAgent}`);
  return textoSeguro(partes.join("\n"));
}