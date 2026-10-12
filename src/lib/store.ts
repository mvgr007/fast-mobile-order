import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products, type Sector } from "./mock";

export type TableStatus = "livre" | "ocupada" | "conta";
export type Table = { id: number; status: TableStatus; openedAt?: number | undefined; waiter?: string | undefined };
export type LineItem = { uid: string; productId: string; name: string; qty: number; unit: number; addons: string[]; notes: string };
export type Ticket = { id: string; tableId: number; sector: Sector; items: LineItem[]; status: "novo" | "preparando" | "pronto"; createdAt: number; waiter: string };

export type Config = { host: string; port: number; demo: boolean; kioskTable: number | null; adminPin: string };

type State = {
  waiter: string | null;
  config: Config;
  setConfig: (c: Partial<Config>) => void;
  tables: Table[];
  carts: Record<number, LineItem[]>;
  tickets: Ticket[];
  login: (name: string) => void;
  logout: () => void;
  addToCart: (tableId: number, item: Omit<LineItem, "uid">) => void;
  changeQty: (tableId: number, uid: string, delta: number) => void;
  sendOrder: (tableId: number) => void;
  setTicket: (id: string, status: Ticket["status"]) => void;
  requestBill: (tableId: number) => void;
  closeTable: (tableId: number) => void;
  reset: () => void;
};

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
  return { tables, tickets, carts: {} as Record<number, LineItem[]> };
};

export const lineTotal = (i: LineItem) => i.qty * i.unit;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      waiter: null,
      config: { host: "192.168.0.10", port: 8090, demo: true, kioskTable: null, adminPin: "0000" },
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
      sendOrder: (tableId) => {
        const s = get();
        const cart = s.carts[tableId] ?? [];
        if (!cart.length) return;
        const bySector: Record<string, LineItem[]> = {};
        cart.forEach((i) => {
          const sec = products.find((p) => p.id === i.productId)?.sector ?? "cozinha";
          (bySector[sec] ??= []).push(i);
        });
        const newTickets: Ticket[] = Object.entries(bySector).map(([sector, items]) => ({
          id: uid(), tableId, sector: sector as Sector, items, status: "novo", createdAt: Date.now(), waiter: s.waiter ?? "—",
        }));
        set({
          tickets: [...s.tickets, ...newTickets],
          carts: { ...s.carts, [tableId]: [] },
          tables: s.tables.map((t) =>
            t.id === tableId ? { ...t, status: "ocupada", openedAt: t.openedAt ?? Date.now(), waiter: t.waiter ?? s.waiter ?? undefined } : t,
          ),
        });
      },
      setTicket: (id, status) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) })),
      requestBill: (tableId) => set((s) => ({ tables: s.tables.map((t) => (t.id === tableId ? { ...t, status: "conta" } : t)) })),
      closeTable: (tableId) =>
        set((s) => ({
          tickets: s.tickets.filter((t) => t.tableId !== tableId),
          carts: { ...s.carts, [tableId]: [] },
          tables: s.tables.map((t) => (t.id === tableId ? { id: t.id, status: "livre" } : t)),
        })),
      reset: () => set({ ...initial() }),
    }),
    { name: "fast-mobile-demo", skipHydration: true },
  ),
);

export const tableItems = (tickets: Ticket[], tableId: number) => tickets.filter((t) => t.tableId === tableId).flatMap((t) => t.items);
export const tableTotal = (tickets: Ticket[], tableId: number) => tableItems(tickets, tableId).reduce((a, i) => a + lineTotal(i), 0);
