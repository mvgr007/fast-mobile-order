# FAST Mobile — protótipo web para pedidos na mesa

Por que web (PWA): um só sistema para tablet e celular (Android/iOS), sem loja de apps, atualização instantânea para todos os restaurantes, pode ser "instalado" na tela inicial. Combina com o FAST, que já roda em client/server e nuvem — no futuro o app web conversa com o servidor FAST.

## Telas (dados de exemplo, em português)
1. **Entrada do garçom** — escolher garçom por nome/PIN (simulado).
2. **Mapa de mesas** — grade de mesas com status: livre, ocupada, aguardando conta; tempo aberto e valor parcial.
3. **Cardápio e pedido** — categorias (Lanches, Pizzas, Bebidas, Sobremesas), busca, adicionais, observações ("sem cebola"), quantidade, carrinho e botão "Enviar para cozinha".
4. **Painel da cozinha** — pedidos chegando por mesa, separados por setor (cozinha/bar), marcar "preparando" e "pronto".
5. **Fechar conta** — itens da mesa, taxa de serviço 10% opcional, divisão por pessoas, forma de pagamento (simulada), liberar mesa.

Estado compartilhado na memória do navegador, para a demonstração fluir: pedido enviado aparece na cozinha e na conta da mesa.

## Visual
Tablet-first, botões grandes para uso rápido, tema escuro opcional, cores com identidade própria (não genérica), funciona em celular.

## Detalhes técnicos
- Rotas: `/` (garçom), `/mesas`, `/mesas/$id` (pedido), `/mesas/$id/conta`, `/cozinha`.
- Store com zustand persistido em localStorage; dados mock em `src/lib/mock`.
- Manifest PWA básico (nome, ícone, cor). Sem backend nesta fase.
- Próxima fase (fora deste plano): API de integração com o banco do FAST.
