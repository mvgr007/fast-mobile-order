# FAST Mobile Order

Protótipo web (PWA) da versão mobile do **Insertsoft FAST**, sistema de automação comercial para
restaurantes. Permite que o garçom tire pedidos na mesa pelo tablet ou celular, e que um tablet fixo
na mesa funcione como **autoatendimento** para o cliente.

- Site da Insertsoft: https://insertsoft.com.br/
- Sistema FAST: https://insertsoft.com.br/Insertsoft-FAST

## Por que web e não app nativo

Um só sistema roda em Android, iOS e tablets, sem loja de aplicativos. As atualizações chegam na hora
para todos os restaurantes, e o app pode ser "instalado" na tela inicial (manifest PWA). Isso combina
com o FAST, que já trabalha em cliente/servidor e nuvem: na próxima fase o app conversa com o
**Conector FAST** no servidor do restaurante.

> **Fase atual: demonstração.** Ainda não há backend. Os dados são fictícios (`src/lib/mock.ts`) e o
> estado fica no `localStorage` de cada aparelho. Por isso, **pedidos não são compartilhados entre
> aparelhos diferentes**, só entre abas do mesmo navegador. Pagamento e impressão são simulados.

## Telas

| Rota | Função |
| --- | --- |
| `/` | Escolha do modo: Garçom ou Autoatendimento |
| `/garcom` | Login do garçom por PIN de 4 dígitos |
| `/mesas` | Mapa das mesas (livre, ocupada, pediu conta), chamados de garçom e vendas do dia |
| `/pedido/$id` | Cardápio, adicionais, observações, carrinho e envio para produção |
| `/conta/$id` | Fechamento: taxa de serviço, divisão por pessoas, pagamento, pré-conta de 40 colunas |
| `/cozinha` | Painel de produção por setor (cozinha/bar): novo → preparando → pronto |
| `/autoatendimento` | Tablet fixo na mesa: pedido, carrinho, chamar garçom, minha conta |
| `/config` | (senha de admin) Modo demo, IP/porta/HTTPS do Conector FAST, mesa do tablet |
| `/logs` | Arquivos de log diários `Log_AAAAMMDD` com códigos E101–E901 |

As telas do modo garçom (`/mesas`, `/pedido/$id`, `/conta/$id`) só abrem com um garçom logado. O
painel da cozinha fica aberto, pois normalmente roda numa tela fixa.

### Regras de negócio implementadas

- O pedido é dividido em **um ticket por setor de produção**.
- Mesa com **conta solicitada não aceita novos itens** (erro E204) até o garçom reabri-la.
- "Chamar garçom" no tablet marca a mesa no mapa. O chamado é dado como atendido quando o garçom abre a mesa.
- Ao receber, a **venda fica registrada** (itens, taxa, total, pessoas, forma de pagamento, garçom).
- Se a página estiver em `https://`, o Conector FAST também precisa usar HTTPS. O navegador bloqueia
  chamadas HTTP feitas a partir de páginas seguras (erro E106).

### Dados de demonstração

Garçons: Carlos `1111`, Juliana `2222`, Rafael `3333`, Patrícia `4444`. Senha de administrador: `0000`.
As dicas de PIN e senha só aparecem na tela com o **modo demonstração** ligado.

## Stack

TanStack Start (React 19, SSR) · TanStack Router (rotas por arquivo em `src/routes`) · Vite ·
Tailwind CSS 4 · shadcn/ui · zustand · Vitest.

```
src/
├── routes/        uma tela por arquivo (routeTree.gen.ts é gerado automaticamente)
├── components/    AppShell, ItemOptions (adicionais/observação) e componentes ui/
├── hooks/         use-store-hydrated, use-mobile
└── lib/
    ├── store.ts   estado global: mesas, carrinhos, tickets, vendas, configuração
    ├── mock.ts    cardápio, garçons e categorias de exemplo
    ├── cupom.ts   pré-conta em texto de 40 colunas
    └── logger.ts  log de erros diário e catálogo de códigos
```

## Desenvolvimento

O Lovable usa **bun** (`bun.lock`), mas npm também funciona.

```sh
bun install        # ou: npm i
bun run dev        # ou: npm run dev
bun run test       # testes (Vitest)
bun run lint
bun run build
```

## Lovable

Projeto conectado ao [Lovable](https://lovable.dev/projects/4a237b92-7d35-4acd-91f0-cc01e2485a45).
Commits na `main` sincronizam com o editor, e as mudanças feitas no Lovable voltam para este
repositório. **Não reescreva o histórico já publicado** (force push, rebase ou amend), senão o
histórico se perde do lado do Lovable.

## Próxima fase

1. API do Conector FAST: operadores, cardápio, mesas, pedidos e fechamento, consumida via `@tanstack/react-query`.
2. Sincronização em tempo real entre aparelhos (WebSocket/SSE).
3. Autenticação de garçons e administrador **validada no servidor**. Hoje PINs e senha ficam no aparelho.
4. Emissão de NFC-e e impressão pelo FAST.
