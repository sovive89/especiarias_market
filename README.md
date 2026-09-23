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

## Painel do gestor (`/admin`)

Moldura própria (menu lateral no computador, barra inferior no celular), referência: portal de
parceiros dos apps de delivery. Cada tela tem endereço próprio:

- **Início** (`/admin`): vendas, pedidos e ticket médio do dia, fila atual, insumos para repor e mais vendidos.
- **Pedidos** (`/admin/pedidos`): colunas Novos → Em preparo → Prontos → Em entrega, com botão para
  avançar, WhatsApp/ligar para o cliente e cancelar (cancelar **devolve os insumos ao estoque**).
- **Cardápio** (`/admin/cardapio`): cards por categoria com foto, nome, descrição e **valor por unidade
  de medida**. Cada item aponta para o **insumo** descontado na venda (vários itens podem usar o
  mesmo insumo). Criar, editar, pausar e excluir; o formulário mostra a prévia do card na loja.
- **Estoque** (`/admin/estoque`): insumos em cards, entrada (compra, recalcula o custo médio),
  contagem e histórico de movimentações.
- **Entregadores** (`/admin/entregadores`): cadastro de quem entrega (nome, telefone e um PIN de
  4 dígitos). É o que abre a porta em `/entregador` — sem cadastro, o app pede login e não deixa
  passar. Pausar um entregador bloqueia o login sem apagar o histórico dele. Enquanto está
  disponível, o app do entregador compartilha a localização de GPS do próprio celular; aqui aparece
  um link "Ver no mapa" com a última posição conhecida.
- **WhatsApp Business** (`/admin/whatsapp`): liga um bot de **notificações automáticas** — avisa o
  cliente pelo WhatsApp oficial da loja quando o pedido muda de etapa (aceito, saiu para entrega
  etc.), usando templates aprovados na Meta. Passo a passo completo de configuração (conta Meta,
  número, templates, variáveis de ambiente) em [`docs/WHATSAPP.md`](docs/WHATSAPP.md). Sem
  configurar, a tela só mostra "não configurado" e o resto do app funciona normal.

Confirmar o pagamento na loja registra o pedido (código `MP-0001`, `MP-0002`…), baixa o estoque e
abre o WhatsApp da loja com o pedido pronto. Não há cadastro de cliente: só nome e telefone do pedido.

Sem banco de dados por enquanto: tudo fica salvo no navegador. Veja `docs/API.md` para ligar a um backend.

## Pendências conhecidas

- As imagens em `src/assets/*.jpg` são **provisórias**. Substitua pelas fotos originais
  do projeto no Lovable mantendo os mesmos nomes de arquivo.
- Nome da marca: o app usa "Mercado Pronto" (vem de `operation.name` em `src/data/mock.ts`),
  mas o projeto se chama "Especiarias Market". Trocar em um lugar muda loja e entregador.
