# Especiarias Market

Marketplace de pedidos e entregas em um único projeto:

| Área | Endereço | Para quem |
|---|---|---|
| Loja | `/`, `/catalog`, `/product/:id`, `/cart`, `/checkout/*`, `/tracking` | Cliente |
| Operação | `/admin` | Equipe da loja |
| Entregador | `/entregador`, `/entregador/rota`, `/entregador/entregas`, `/entregador/historico`, `/entregador/perfil` | Entregadores |

Tudo roda com **dados simulados** (sem banco de dados, pagamento ou mapa reais).

## Rodar no computador

```bash
npm install
npm run dev        # abre em http://localhost:3000 (ou a porta mostrada no terminal)
npm run build      # gera a versão de produção em .output/
npm run typecheck  # confere os tipos do TypeScript
```

## Tecnologias

- **React 19** + **TypeScript**
- **TanStack Start / Router**: cada arquivo em `src/routes/` vira uma página (roteamento por arquivos)
- **Tailwind CSS 4** na loja e no admin; **CSS próprio** no entregador (`src/driver/styles/driver.css`)
- **Vite** para desenvolvimento e build

## Estrutura

```
src/
├── routes/                 → páginas (o nome do arquivo é o endereço)
│   ├── __root.tsx          → moldura geral: <html>, fontes, manifesto do PWA
│   ├── index.tsx, catalog.tsx, cart.tsx, checkout.*.tsx … → loja
│   ├── admin.tsx           → painel de operação
│   ├── entregador.tsx      → "pai" da área do entregador (carrega CSS e contexto)
│   ├── entregador.*.tsx    → cada tela do entregador
│   └── driver.tsx          → endereço antigo, redireciona para /entregador
├── components/, context/, data/, types/, services/  → loja e admin
└── driver/                 → tudo do entregador, isolado
    ├── pages/              → as 5 telas
    ├── components/         → ui, layout e peças de entrega
    ├── context/            → estado e ações (DriverContext)
    ├── services/           → fonte de dados (mock hoje, API amanhã)
    └── styles/driver.css   → visual do entregador (escopado em .driver-app)
```

## Dois apps instaláveis (PWA)

- A loja usa `public/manifest.webmanifest` (abre em `/`).
- O entregador usa `public/entregador.webmanifest` (abre em `/entregador`), com ícone próprio.

## Backend (futuro)

O entregador já está preparado para trocar os dados simulados por uma API real.
Veja [`docs/API.md`](docs/API.md) e o arquivo `.env.example`.

## Pendências conhecidas

- As imagens em `src/assets/*.jpg` são **provisórias**. Substitua pelas fotos originais
  do projeto no Lovable mantendo os mesmos nomes de arquivo.
- Nome da marca: o app usa "Mercado Pronto" (vem de `operation.name` em `src/data/mock.ts`),
  mas o projeto se chama "Especiarias Market". Trocar em um lugar muda loja e entregador.
