# Geolocalização — passo a passo (Geocoding)

Este é o **primeiro passo** de uma frente maior (rotas, otimização de entregas, distribuição por
distância) que ainda não foi implementada — fica documentada à parte quando chegar a vez. Por
enquanto, o app só faz uma coisa: transformar o endereço que o cliente digita no checkout em
coordenadas (latitude/longitude), pra aparecer um link "ver no mapa" nos pedidos em
`/admin/pedidos`.

Sem a chave configurada, o resto do app funciona normal — o endereço continua sendo salvo em
texto, só não aparece o link do mapa.

## O que você vai ter no final

Uma **chave de API** da Google Maps Platform, restrita à **Geocoding API**.

## Passo 1 — Criar/usar um projeto no Google Cloud

1. Acesse **console.cloud.google.com** e crie um projeto (ou use um que já tenha).
2. É necessário ter **faturamento (billing) ativado** no projeto — a Google exige cartão
   cadastrado mesmo dentro da cota gratuita mensal. Vá em **Faturamento** e vincule uma conta.

## Passo 2 — Ativar a Geocoding API

1. No menu, vá em **APIs e serviços** → **Biblioteca**.
2. Procure **Geocoding API** e clique em **Ativar**.

## Passo 3 — Criar a chave de API

1. Vá em **APIs e serviços** → **Credenciais** → **Criar credenciais** → **Chave de API**.
2. Copie a chave gerada.
3. **Restrinja a chave** (importante, para ninguém usar sua cota): em **Restrições de API**,
   marque só **Geocoding API**. Em **Restrições de aplicativo**, como esta chave só é usada pelo
   servidor (nunca pelo navegador do cliente), pode restringir por **endereços IP** se souber o IP
   de saída da Vercel, ou deixar sem restrição de aplicativo (a restrição por API já limita o dano).

## Passo 4 — Configurar no Vercel

No painel do projeto na Vercel: **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `GOOGLE_MAPS_API_KEY` | a chave do Passo 3 |

**Importante:** essa variável **nunca** deve começar com `VITE_` — isso a colocaria no código que
roda no navegador do cliente, expondo a chave. O app já está preparado para lê-la só no servidor
(mesmo padrão do token do WhatsApp).

Depois de salvar, refaça o deploy (ou espere o próximo automático) para a variável valer.

## Como funciona no app

- No checkout, ao confirmar o pedido, o app tenta resolver o endereço digitado em lat/long antes
  de criar o pedido. Se a chave não estiver configurada, o endereço não for encontrado, ou a
  chamada falhar por qualquer motivo, o pedido é criado normalmente — só sem o link do mapa.
- Em `/admin/pedidos`, quando o pedido tem coordenadas, aparece "· ver no mapa" ao lado do
  endereço, abrindo o Google Maps na localização exata.
- O pedido pelo bot do WhatsApp (ver `docs/WHATSAPP.md`) já manda coordenadas de GPS direto pelo
  botão nativo do WhatsApp — não passa pela Geocoding API, então funciona mesmo sem essa chave
  configurada.

## Perguntas comuns

**Preciso pagar alguma coisa?** A Geocoding API tem uma cota gratuita mensal generosa (US$ 200 em
créditos, o suficiente para milhares de chamadas). Uma loja pequena/média dificilmente estoura
isso.

**Isso substitui o endereço em texto?** Não — o endereço digitado continua sendo o que aparece pra
todo mundo. As coordenadas são só um complemento (o link do mapa).

**O que vem depois?** Rotas (Routes API), otimização de entrega por proximidade e distribuição
entre entregadores fazem parte de uma fase futura, ainda não implementada. Quando chegar a vez,
este documento ganha uma seção nova — as coordenadas que já são salvas aqui são exatamente a base
que essa fase vai usar.
