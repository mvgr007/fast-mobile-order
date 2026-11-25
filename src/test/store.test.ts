import { beforeEach, describe, expect, it } from "vitest";
import {
  calcularConta,
  DEFAULT_CONFIG,
  tableItems,
  urlServidor,
  useStore,
  type LineItem,
} from "@/lib/store";
import { listarLogs } from "@/lib/logger";

const item = (productId: string, name: string, unit: number, qty = 1): Omit<LineItem, "uid"> => ({
  productId,
  name,
  qty,
  unit,
  addons: [],
  notes: "",
});
const st = () => useStore.getState();
const mesa = (id: number) => st().tables.find((t) => t.id === id);
const ticketsDa = (id: number) => st().tickets.filter((t) => t.tableId === id);

describe("store do FAST Mobile", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ waiter: null, config: DEFAULT_CONFIG });
    st().reset();
  });

  it("envia o carrinho separando um ticket por setor e ocupa a mesa", () => {
    st().login("Carlos");
    st().addToCart(1, item("p1", "X-Burger", 28));
    st().addToCart(1, item("p10", "Refrigerante Lata", 7, 2));

    expect(st().sendOrder(1)).toBe(true);

    const tickets = ticketsDa(1);
    expect(tickets.map((t) => t.sector).sort()).toEqual(["bar", "cozinha"]);
    expect(tickets.every((t) => t.status === "novo" && t.waiter === "Carlos")).toBe(true);
    expect(mesa(1)).toMatchObject({ status: "ocupada", waiter: "Carlos" });
    expect(st().carts[1]).toEqual([]);
  });

  it("não envia carrinho vazio", () => {
    expect(st().sendOrder(1)).toBe(false);
    expect(ticketsDa(1)).toHaveLength(0);
  });

  it("bloqueia novos itens em mesa com conta solicitada (E204) até ser reaberta", () => {
    expect(mesa(7)?.status).toBe("conta");
    st().addToCart(7, item("p10", "Refrigerante Lata", 7));

    expect(st().sendOrder(7)).toBe(false);
    expect(ticketsDa(7)).toHaveLength(2);
    expect(st().carts[7]).toHaveLength(1);
    expect(mesa(7)?.status).toBe("conta");
    expect(listarLogs()[0]?.conteudo).toContain("[E204]");

    st().reopenTable(7);
    expect(mesa(7)?.status).toBe("ocupada");
    expect(st().sendOrder(7)).toBe(true);
    expect(ticketsDa(7)).toHaveLength(3);
  });

  it("registra o operador informado sem mexer no garçom logado", () => {
    st().addToCart(5, item("p13", "Caipirinha", 22));
    expect(st().sendOrder(5, "Autoatendimento")).toBe(true);
    expect(ticketsDa(5)[0]?.waiter).toBe("Autoatendimento");
    expect(mesa(5)?.waiter).toBe("Autoatendimento");
    expect(st().waiter).toBeNull();
  });

  it("calcula subtotal, taxa de serviço de 10% e total", () => {
    const items = tableItems(st().tickets, 3); // 2× X-Tudo 39 + 1× Fritas 24 + 2× Cerveja 16
    expect(calcularConta(items, true)).toEqual({
      subtotal: 134,
      fee: expect.closeTo(13.4, 5),
      total: expect.closeTo(147.4, 5),
    });
    expect(calcularConta(items, false)).toEqual({ subtotal: 134, fee: 0, total: 134 });
  });

  it("ao fechar a conta registra a venda e libera a mesa", () => {
    const venda = st().closeTable(3, { method: "pix", serviceFee: true, people: 2 });

    expect(venda).toMatchObject({
      tableId: 3,
      method: "pix",
      people: 2,
      subtotal: 134,
      waiter: "Carlos",
    });
    expect(venda?.total).toBeCloseTo(147.4, 5);
    expect(venda?.items).toHaveLength(3);
    expect(st().sales).toHaveLength(1);
    expect(mesa(3)).toEqual({ id: 3, status: "livre" });
    expect(ticketsDa(3)).toHaveLength(0);
  });

  it("não registra venda para mesa sem consumo", () => {
    expect(st().closeTable(4, { method: "dinheiro", serviceFee: false, people: 1 })).toBeNull();
    expect(st().sales).toHaveLength(0);
  });

  it("chamado do garçom: marca, atende e é limpo ao liberar a mesa", () => {
    st().callWaiter(9);
    expect(mesa(9)?.chamando).toBe(true);
    st().dismissCall(9);
    expect(mesa(9)?.chamando).toBe(false);

    st().callWaiter(3);
    st().closeTable(3, { method: "credito", serviceFee: false, people: 1 });
    expect(mesa(3)?.chamando).toBeUndefined();
  });

  it("monta o endereço do Conector com http ou https", () => {
    expect(urlServidor({ host: "10.0.0.5", port: 8090, https: false })).toBe(
      "http://10.0.0.5:8090",
    );
    expect(urlServidor({ host: "fast.local", port: 443, https: true })).toBe(
      "https://fast.local:443",
    );
  });
});
