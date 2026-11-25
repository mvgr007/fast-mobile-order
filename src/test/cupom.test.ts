import { describe, expect, it } from "vitest";
import { LARGURA_CUPOM, montarCupom } from "@/lib/cupom";
import { calcularConta, type LineItem } from "@/lib/store";

const items: LineItem[] = [
  {
    uid: "a",
    productId: "p3",
    name: "X-Tudo",
    qty: 2,
    unit: 39,
    addons: ["Bacon", "Queijo extra"],
    notes: "sem cebola",
  },
  {
    uid: "b",
    productId: "p9",
    name: "Picanha na Chapa com nome muito comprido demais",
    qty: 1,
    unit: 89,
    addons: [],
    notes: "",
  },
];

const cupom = (people = 1) =>
  montarCupom({
    id: 7,
    items,
    people,
    waiter: "Juliana",
    data: new Date(2026, 10, 25, 20, 30),
    ...calcularConta(items, true),
  });

describe("cupom de pré-conta", () => {
  it("nenhuma linha passa de 40 colunas", () => {
    for (const linha of cupom(3).split("\n"))
      expect(linha.length).toBeLessThanOrEqual(LARGURA_CUPOM);
  });

  it("traz mesa, garçom, adicionais, observação e totais", () => {
    const texto = cupom();
    expect(texto).toContain("PRE-CONTA - MESA 07");
    expect(texto).toContain("NAO E DOCUMENTO FISCAL");
    expect(texto).toContain("Garcom: Juliana");
    expect(texto).toContain("   + Bacon");
    expect(texto).toContain("   Obs: sem cebola");
    expect(texto).toMatch(/Subtotal\s+167,00/);
    expect(texto).toMatch(/Taxa de servico \(10%\)\s+16,70/);
    expect(texto).toMatch(/TOTAL R\$\s+183,70/);
    expect(texto).not.toContain("Dividido por");
  });

  it("mostra a divisão quando há mais de uma pessoa", () => {
    expect(cupom(2)).toMatch(/Dividido por 2 pessoas\s+91,85/);
  });
});
