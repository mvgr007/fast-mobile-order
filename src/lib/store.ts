import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products, type Sector } from "./mock";
import { registrarErro } from "./logger";

export type TableStatus = "livre" | "ocupada" | "conta";
export type Table = {
  id: number;
  status: TableStatus;
  openedAt?: number | undefined;
  waiter?: string | undefined;
  /** Cliente apertou "Chamar garçom" no tablet da mesa. */
  chamando?: boolean | undefined;
};
export type LineItem = { uid: string; productId: string; name: string; qty: number; unit: number; addons: string[]; notes: string };
export type Ticket = { id: string; tableId: number; sector: Sector; items: LineItem[]; status: "novo" | "preparando" | "pronto"; createdAt: number; waiter: string };

export type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro";
export type Payment = { method: PaymentMethod; serviceFee: boolean; people: number };
/** Conta encerrada. Fica guardada para conferência e futura integração com o caixa do FAST. */
export type Sale = {
  id: string;
  tableId: number;
  items: LineItem[];
  subtotal: number;
  fee: number;
  total: number;
  people: number;
  method: PaymentMethod;
  waiter?: string | undefined;
  openedAt?: number | undefined;
  closedAt: number;
};

export type Config = { host: string; port: number; https: boolean; demo: boolean; kioskTable: number | null; adminPin: string };

type State = {
  waiter: string | null;
  config: Config;
  setConfig: (c: Partial<Config>) => void;
  tables: Table[];
  carts: Record<number, LineItem[]>;
  tickets: Ticket[];
  sales: Sale[];
  login: (name: string) => void;
  logout: () => void;
  addToCart: (tableId: number, item: Omit<LineItem, "uid">) => void;
  changeQty: (tableId: number, uid: string, delta: number) => void;
  removeItem: (tableId: number, uid: string) => void;
  /** Envia o carrinho para produção. Retorna false se a mesa não aceita novos itens. */
  sendOrder: (tableId: number, operador?: string) => boolean;
  setTicket: (id: string, status: Ticket["status"]) => void;
  requestBill: (tableId: number) => void;
  /** Volta uma mesa com conta solicitada para "ocupada", liberando novos lançamentos. */
  reopenTable: (tableId: number) => void;
  callWaiter: (tableId: number) => void;
  dismissCall: (tableId: number) => void;
  /** Registra a venda e libera a mesa. */
  closeTable: (tableId: number, payment: Payment) => Sale | null;
  reset: () => void;
};

export const SERVICE_RATE = 0.1;
export const DEFAULT_CONFIG: Config = { host: "192.168.0.10", port: 8090, https: false, demo: true, kioskTable: null, adminPin: "0000" };

const uid = () => Math.random().toString(36).slice(2, 10);
const now = Date.now();
const li = (pid: string, qty: number): LineItem => {
  const p = products.find((x) => x.id === pid)!;
  return { uid: uid(), productId: pid, name: p.name, qty, unit: p.price, addons: [], notes: "" };
};
const initial = () => {
  const tables: Table[] = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, status: "livre" as TableStatus }));
  tables[2] = { id: 3, status: "ocupada", openedAt: now - 35 * 60000, waiter: "Carlos" };
  tables[6] = { id: 7, status: "conta", openedAt: now - 80 * 60000, waiter: "Juliana" };
  tables[11] = { id: 12, status: "ocupada", openedAt: now - 12 * 60000, waiter: "Rafael" };
  const tickets: Ticket[] = [
    { id: uid(), tableId: 3, sector: "cozinha", items: [li("p3", 2), li("p4", 1)], status: "preparando", createdAt: now - 20 * 60000, waiter: "Carlos" },
    { id: uid(), tableId: 3, sector: "bar", items: [li("p12", 2)], status: "pronto", createdAt: now - 30 * 60000, waiter: "Carlos" },
    { id: uid(), tableId: 7, sector: "cozinha", items: [li("p9", 1), li("p15", 2)], status: "pronto", createdAt: now - 70 * 60000, waiter: "Juliana" },
    { id: uid(), tableId: 7, sector: "bar", items: [li("p13", 3), li("p14", 1)], status: "pronto", createdAt: now - 75 * 60000, waiter: "Juliana" },
    { id: uid(), tableId: 12, sector: "cozinha", items: [li("p5", 1)], status: "novo", createdAt: now - 4 * 60000, waiter: "Rafael" },
    { id: uid(), tableId: 12, sector: "bar", items: [li("p10", 3)], status: "novo", createdAt: now - 4 * 60000, waiter: "Rafael" },
  ];
  return { tables, tickets, carts: {} as Record<number, LineItem[]>, sales: [] as Sale[] };
};

export const lineTotal = (i: LineItem) => i.qty * i.unit;

export function calcularConta(items: LineItem[], comServico: boolean) {
  const subtotal = items.reduce((a, i) => a + lineTotal(i), 0);
  const fee = comServico ? subtotal * SERVICE_RATE : 0;
  return { subtotal, fee, total: subtotal + fee };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      waiter: null,
      config: DEFAULT_CONFIG,
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      ...initial(),
      login: (name) => set({ waiter: name }),
      logout: () => set({ waiter: null }),
      addToCart: (tableId, item) =>
        set((s) => ({ carts: { ...s.carts, [tableId]: [...(s.carts[tableId] ?? []), { ...item, uid: uid() }] } })),
      changeQty: (tableId, id, d) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [tableId]: (s.carts[tableId] ?? []).map((i) => (i.uid === id ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0),
          },
        })),
      removeItem: (tableId, id) =>
        set((s) => ({
          carts: { ...s.carts, [tableId]: (s.carts[tableId] ?? []).filter((i) => i.uid !== id) },
        })),
      sendOrder: (tableId, operador) => {
        const s = get();
        const cart = s.carts[tableId] ?? [];
        if (!cart.length) return false;
        if (s.tables.find((t) => t.id === tableId)?.status === "conta") {
          registrarErro("NEG_MESA_EM_FECHAMENTO", `Mesa ${tableId}`);
          return false;
        }
        const quem = operador ?? s.waiter ?? "—";
        const bySector: Record<string, LineItem[]> = {};
        cart.forEach((i) => {
          const sec = products.find((p) => p.id === i.productId)?.sector ?? "cozinha";
          (bySector[sec] ??= []).push(i);
        });
        const newTickets: Ticket[] = Object.entries(bySector).map(([sector, items]) => ({
          id: uid(), tableId, sector: sector as Sector, items, status: "novo", createdAt: Date.now(), waiter: quem,
        }));
        set({
          tickets: [...s.tickets, ...newTickets],
          carts: { ...s.carts, [tableId]: [] },
          tables: s.tables.map((t) =>
            t.id === tableId ? { ...t, status: "ocupada", openedAt: t.openedAt ?? Date.now(), waiter: t.waiter ?? quem } : t,
          ),
        });
        return true;
      },
      setTicket: (id, status) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) })),
      requestBill: (tableId) => set((s) => ({ tables: s.tables.map((t) => (t.id === tableId ? { ...t, status: "conta" } : t)) })),
      reopenTable: (tableId) =>
        set((s) => ({ tables: s.tables.map((t) => (t.id === tableId && t.status === "conta" ? { ...t, status: "ocupada" } : t)) })),
      callWaiter: (tableId) => set((s) => ({ tables: s.tables.map((t) => (t.id === tableId ? { ...t, chamando: true } : t)) })),
      dismissCall: (tableId) => set((s) => ({ tables: s.tables.map((t) => (t.id === tableId ? { ...t, chamando: false } : t)) })),
      closeTable: (tableId, payment) => {
        const s = get();
        const items = tableItems(s.tickets, tableId);
        if (!items.length) return null;
        const table = s.tables.find((t) => t.id === tableId);
        const sale: Sale = {
          id: uid(),
          tableId,
          items,
          ...calcularConta(items, payment.serviceFee),
          people: Math.max(1, payment.people),
          method: payment.method,
          waiter: table?.waiter,
          openedAt: table?.openedAt,
          closedAt: Date.now(),
        };
        set({
          sales: [...s.sales, sale],
          tickets: s.tickets.filter((t) => t.tableId !== tableId),
          carts: { ...s.carts, [tableId]: [] },
          tables: s.tables.map((t) => (t.id === tableId ? { id: t.id, status: "livre" } : t)),
        });
        return sale;
      },
      reset: () => set({ ...initial() }),
    }),
    {
      name: "fast-mobile-demo",
      skipHydration: true,
      // Mescla a config salva com os padrões, para que campos novos (ex.: https) não fiquem indefinidos
      // em aparelhos que já tinham uma versão anterior salva.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, config: { ...current.config, ...(p.config ?? {}) } };
      },
    },
  ),
);

export function tableItems(tickets: Ticket[], tableId: number) {
  return tickets.filter((t) => t.tableId === tableId).flatMap((t) => t.items);
}
export const tableTotal = (tickets: Ticket[], tableId: number) => tableItems(tickets, tableId).reduce((a, i) => a + lineTotal(i), 0);

/** Endereço do Conector FAST conforme a configuração. */
export const urlServidor = (c: Pick<Config, "host" | "port" | "https">) => `${c.https ? "https" : "http"}://${c.host}:${c.port}`;
