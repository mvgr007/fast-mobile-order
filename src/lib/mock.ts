import burger from "@/assets/burger.jpg";
import pizza from "@/assets/pizza.jpg";
import caipirinha from "@/assets/caipirinha.jpg";
import petit from "@/assets/petit.jpg";

export type Sector = "cozinha" | "bar";
export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  sector: Sector;
  desc?: string;
  imageUrl?: string;
  addons?: { name: string; price: number }[];
};

export const waiters = [
  { id: "w1", name: "Carlos", pin: "1111" },
  { id: "w2", name: "Juliana", pin: "2222" },
  { id: "w3", name: "Rafael", pin: "3333" },
  { id: "w4", name: "Patrícia", pin: "4444" },
];

export const categories = ["Lanches", "Pizzas", "Pratos", "Bebidas", "Sobremesas"];

const burgerAddons = [
  { name: "Bacon", price: 5 },
  { name: "Queijo extra", price: 4 },
  { name: "Ovo", price: 3 },
];
const pizzaAddons = [
  { name: "Borda catupiry", price: 9 },
  { name: "Borda cheddar", price: 9 },
];

export const products: Product[] = [
  { id: "p1", imageUrl: burger, name: "X-Burger", price: 28, category: "Lanches", sector: "cozinha", desc: "Pão brioche, blend 150g, queijo", addons: burgerAddons },
  { id: "p2", imageUrl: burger, name: "X-Salada", price: 31, category: "Lanches", sector: "cozinha", desc: "Blend 150g, queijo, alface, tomate", addons: burgerAddons },
  { id: "p3", imageUrl: burger, name: "X-Tudo", price: 39, category: "Lanches", sector: "cozinha", desc: "Completo da casa", addons: burgerAddons },
  { id: "p4", name: "Porção de Fritas", price: 24, category: "Lanches", sector: "cozinha", addons: [{ name: "Cheddar e bacon", price: 8 }] },
  { id: "p5", imageUrl: pizza, name: "Pizza Calabresa", price: 62, category: "Pizzas", sector: "cozinha", desc: "Grande, 8 pedaços", addons: pizzaAddons },
  { id: "p6", name: "Pizza Margherita", price: 58, category: "Pizzas", sector: "cozinha", desc: "Grande, 8 pedaços", addons: pizzaAddons },
  { id: "p7", imageUrl: pizza, name: "Pizza Portuguesa", price: 66, category: "Pizzas", sector: "cozinha", desc: "Grande, 8 pedaços", addons: pizzaAddons },
  { id: "p8", name: "Parmegiana de Frango", price: 54, category: "Pratos", sector: "cozinha", desc: "Arroz, fritas e salada" },
  { id: "p9", name: "Picanha na Chapa", price: 89, category: "Pratos", sector: "cozinha", desc: "Serve 2 pessoas" },
  { id: "p10", name: "Refrigerante Lata", price: 7, category: "Bebidas", sector: "bar" },
  { id: "p11", name: "Suco Natural", price: 12, category: "Bebidas", sector: "bar", addons: [{ name: "Com leite", price: 2 }] },
  { id: "p12", name: "Cerveja 600ml", price: 16, category: "Bebidas", sector: "bar" },
  { id: "p13", imageUrl: caipirinha, name: "Caipirinha", price: 22, category: "Bebidas", sector: "bar" },
  { id: "p14", name: "Água sem gás", price: 5, category: "Bebidas", sector: "bar" },
  { id: "p15", name: "Pudim", price: 14, category: "Sobremesas", sector: "cozinha" },
  { id: "p16", imageUrl: petit, name: "Petit Gâteau", price: 24, category: "Sobremesas", sector: "cozinha", addons: [{ name: "Bola extra de sorvete", price: 6 }] },
];

/** Preço de uma unidade do produto somando os adicionais escolhidos. */
export const precoUnitario = (p: Product, addons: string[]) =>
  p.price + (p.addons ?? []).filter((a) => addons.includes(a.name)).reduce((s, a) => s + a.price, 0);

export const brl =(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const minutesSince = (t?: number) => (t ? Math.max(0, Math.floor((Date.now() - t) / 60000)) : 0);
