# API da área do entregador (/entregador)

Hoje o app roda **sem banco de dados**: os dados vêm de `src/driver/services/mockApi.ts` e ficam só em memória.

Quando o backend existir, basta criar um arquivo `.env` (copie o `.env.example`) com:

```
VITE_DATA_SOURCE=http
VITE_API_URL=https://sua-api.com
```

O app passa a chamar os endpoints abaixo (implementados em `src/driver/services/httpApi.ts`).
Nenhuma tela precisa mudar.

## Endpoints esperados

| Método | Caminho | Corpo | Resposta | Uso no app |
|---|---|---|---|---|
| GET | `/driver/me` | — | `Driver` | Nome, telefone e status do entregador |
| PATCH | `/driver/me/availability` | `{ available: boolean }` | `Driver` | Botão liga/desliga da Home |
| GET | `/driver/me/route` | — | `Route` | Rota do dia |
| POST | `/driver/me/route/start` | — | `Route` | "Iniciar rota" |
| POST | `/driver/me/route/finish` | — | `Route` | "Finalizar rota" (só sem entregas em aberto) |
| GET | `/driver/me/deliveries` | — | `Delivery[]` | Listas e Home |
| GET | `/driver/me/events` | — | `DeliveryEvent[]` | Tela de Histórico |
| POST | `/deliveries/:id/start` | — | `Delivery` | "Iniciar entrega" |
| POST | `/deliveries/:id/arrived` | — | `Delivery` | "Cheguei no local" |
| POST | `/deliveries/:id/complete` | — | `Delivery` | "Confirmar entrega" |
| POST | `/deliveries/:id/problem` | `{ type, description }` | `Delivery` | Registrar problema |

Os formatos (`Driver`, `Route`, `Delivery`, `DeliveryEvent`) estão em `src/driver/types/delivery.ts`.

## Ciclo de vida de uma entrega

```
ASSIGNED ─┐
READY ────┴─▶ IN_ROUTE ──▶ ARRIVED ──▶ DELIVERED_BY_DRIVER ──▶ CONFIRMED_BY_CUSTOMER
                 │            │
                 └────────────┴──▶ PROBLEM
```

## Ainda não preparado (próximas etapas)

- **Login**: `src/driver/lib/api.ts` já tem `setAuthToken()`, mas não existe tela de login.
- **Rastreamento GPS**: `src/driver/services/trackingService.ts` lê o GPS, mas `sendPosition()` ainda não envia nada
  (endpoint previsto: `POST /deliveries/:id/location`).
- **Notificações**: `src/driver/services/notificationService.ts` é só um esqueleto.

---

# API do catálogo e estoque (/admin → Catálogo e Estoque)

Hoje o catálogo e o estoque ficam salvos **no navegador** (`localStorage`), por meio de
`src/services/catalog/repository.ts`. Com `VITE_DATA_SOURCE=http`, o mesmo arquivo passa a usar a API:

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| GET | `/catalog` | — | `CatalogSnapshot` |
| PUT | `/catalog` | `CatalogSnapshot` | — |

`CatalogSnapshot` (em `src/types/marketplace.ts`) = `{ products, skus, inventory, movements }`.

As regras (validação, custo médio, baixa de estoque na venda) estão em
`src/services/catalog/rules.ts`, em funções puras que podem ser reaproveitadas no backend.
Quando houver banco, o ideal é trocar o PUT do snapshot inteiro por endpoints por recurso
(`POST /products`, `POST /inventory/:id/entries`, `POST /orders` que baixa o estoque no servidor)
e as fotos passarem para um storage, guardando só o link.

## Como os dados se ligam

```
Produto (Café coado, foto, descrição, categoria)
  └─ Apresentação / SKU (Copo 300 ml · R$ 8,50 · ativa)
       └─ Insumo (Café em grãos, kg) + quanto desconta por venda (0,018 kg)
```

Confirmar um pedido registra uma movimentação `venda` e baixa o insumo.
Entradas (compras) recalculam o custo médio ponderado; ajustes registram a diferença da contagem.
