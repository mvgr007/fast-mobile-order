import { lineTotal, SERVICE_RATE, type LineItem } from "./store";

/** Largura do cupom em colunas (impressoras térmicas de 58/80 mm em modo texto). */
export const LARGURA_CUPOM = 40;

const W = LARGURA_CUPOM;
const center = (t: string) =>
  t
    .slice(0, W)
    .padStart(Math.floor((W + Math.min(t.length, W)) / 2))
    .padEnd(W);
const lr = (l: string, r: string) => {
  const room = W - r.length - 1;
  return (l.length > room ? l.slice(0, room) : l).padEnd(room) + " " + r;
};
const money = (v: number) => v.toFixed(2).replace(".", ",");

export type DadosCupom = {
  id: number;
  items: LineItem[];
  subtotal: number;
  fee: number;
  total: number;
  people: number;
  waiter?: string | undefined;
  data?: Date;
};

/** Monta a pré-conta (não fiscal) em texto de largura fixa. */
export function montarCupom({
  id,
  items,
  subtotal,
  fee,
  total,
  people,
  waiter,
  data = new Date(),
}: DadosCupom) {
  const line = "-".repeat(W);
  const out = [
    center("RESTAURANTE DEMONSTRACAO"),
    center("CNPJ 00.000.000/0001-00"),
    line,
    center("*** PRE-CONTA - MESA " + String(id).padStart(2, "0") + " ***"),
    center("NAO E DOCUMENTO FISCAL"),
    line,
    lr(
      `Data: ${data.toLocaleDateString("pt-BR")}`,
      data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    ),
    `Garcom: ${waiter ?? "-"}`.slice(0, W),
    line,
    lr("QTD ITEM", "TOTAL"),
  ];
  items.forEach((i) => {
    out.push(lr(`${i.qty}x ${i.name}`, money(lineTotal(i))));
    i.addons.forEach((a) => out.push(`   + ${a}`.slice(0, W)));
    if (i.notes) out.push(`   Obs: ${i.notes}`.slice(0, W));
  });
  out.push(
    line,
    lr("Subtotal", money(subtotal)),
    lr(`Taxa de servico (${Math.round(SERVICE_RATE * 100)}%)`, money(fee)),
    lr("TOTAL R$", money(total)),
  );
  if (people > 1) out.push(lr(`Dividido por ${people} pessoas`, money(total / people)));
  out.push(line, center("Obrigado pela preferencia!"), center("FAST Mobile - Insertsoft"));
  return out.join("\n");
}
