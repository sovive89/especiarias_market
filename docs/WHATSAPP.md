# WhatsApp Business — passo a passo

O app já tem a tela `/admin/whatsapp` e o código pronto para mandar mensagens automáticas pelo
WhatsApp Business quando o pedido muda de etapa ("pedido aceito", "saiu para entrega" etc.). Falta
só a parte que só você pode fazer: criar a conta na Meta e me passar 2 informações.

Sem isso, o resto do app funciona normal — a tela só mostra "Ainda não configurado no servidor".

## O que você vai ter no final

- Um número de WhatsApp Business (pode ser um número novo, só para isso — **não pode ser um número
  já usado no WhatsApp normal ou no WhatsApp Business App do celular**).
- Um **token de acesso permanente** e um **Phone Number ID**.
- Pelo menos 1 "template" de mensagem aprovado pela Meta (o texto que vai ser mandado).

## Passo 1 — Conta Meta Business

1. Acesse **business.facebook.com** e crie uma conta (ou use uma que já tenha, se já tiver
   Instagram/Facebook comercial).
2. Confirme seu e-mail e, se pedir, os dados da empresa (nome, endereço).

## Passo 2 — Criar o app na Meta for Developers

1. Acesse **developers.facebook.com/apps** → **Criar app**.
2. Tipo do app: **Outro** → **Empresa**.
3. Dê um nome (ex.: "Mercado Pronto WhatsApp") e vincule à conta Business do Passo 1.
4. Dentro do app, em **Adicionar produtos**, adicione **WhatsApp**.

## Passo 3 — Número de WhatsApp Business

1. Ainda na configuração do produto WhatsApp, a Meta já dá um **número de teste** gratuito — serve
   para testar tudo antes de usar o número de verdade da loja.
2. Quando estiver pronto para valer, clique em **Adicionar número de telefone** e siga o passo a
   passo (precisa de um número que não esteja em uso em nenhum WhatsApp, nem pessoal nem Business
   App do celular — a Meta manda um código de verificação por SMS ou chamada).
3. Anote o **Phone Number ID** que aparece na tela (é um número longo, tipo `109876543210987`) —
   é diferente do número de telefone em si.

## Passo 4 — Token de acesso permanente

O token que a tela de teste da Meta mostra de cara **expira em 24 horas** — não serve para o app em
produção. Para ter um token que não expira:

1. No painel da conta Business (business.facebook.com/settings), vá em **Usuários** → **Usuários do
   sistema** → **Adicionar**.
2. Crie um usuário do sistema com papel **Admin**.
3. Em **Atribuir ativos**, dê a ele acesso ao app que você criou no Passo 2 (com permissão total).
4. Clique em **Gerar novo token**, escolha o app, marque a permissão **whatsapp_business_messaging**
   (e **whatsapp_business_management**), e gere. Esse token **não expira** — copie e guarde num
   lugar seguro (ex.: um gerenciador de senhas). Você só consegue ver esse valor uma vez.

## Passo 5 — Criar um template de mensagem

Mensagens que a loja manda primeiro (o cliente não escreveu antes) **precisam de um template
aprovado** pela Meta — não dá para mandar texto livre.

1. No painel da conta Business, vá em **WhatsApp Manager** → **Modelos de mensagem** → **Criar
   modelo**.
2. Categoria: **Utilidade** (é uma notificação de status de pedido, não é marketing).
3. Nome do template: minúsculas e `_` no lugar de espaço (ex.: `pedido_confirmado`,
   `saiu_para_entrega`). Você vai usar esse nome exato na tela `/admin/whatsapp`.
4. Idioma: Português (BR).
5. Corpo da mensagem: escreva o texto usando **duas variáveis**, nessa ordem — o app sempre manda o
   **nome do cliente** primeiro e o **código do pedido** depois:
   ```
   Olá {{1}}! Seu pedido {{2}} foi confirmado e já está sendo preparado. 🎉
   ```
   Outro exemplo, para "saiu para entrega":
   ```
   {{1}}, seu pedido {{2}} saiu para entrega! Chega em breve. 🛵
   ```
6. Envie para aprovação. Geralmente sai em minutos, às vezes até 24h. Repita para cada etapa que
   quiser notificar (preparo, pronto, saiu para entrega, cancelado — ou só as que fizerem sentido
   para sua loja).

## Passo 6 — Configurar no Vercel

No painel do projeto na Vercel: **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `WHATSAPP_TOKEN` | o token permanente do Passo 4 |
| `WHATSAPP_PHONE_NUMBER_ID` | o Phone Number ID do Passo 3 |

(`WHATSAPP_API_VERSION` é opcional — só preencha se algum dia a Meta pedir para trocar de versão da
API; o padrão já funciona.)

**Importante:** essas variáveis **nunca** devem começar com `VITE_` — isso as colocaria no código
que roda no navegador do cliente, expondo seu token para qualquer pessoa. O app já está preparado
para lê-las só no servidor.

Depois de salvar, refaça o deploy (ou espere o próximo automático) para as variáveis valerem.

## Passo 7 — Ligar o bot no app

1. Acesse `/admin/whatsapp` no painel do gestor. O card do topo deve mostrar **"Conectado à
   WhatsApp Cloud API"** — se ainda mostrar "não configurado", confira o Passo 6 e o deploy.
2. Ative a chave **"Bot ligado"**.
3. Para cada etapa que você quer notificar, preencha **o nome exato do template** (igual ao Passo 5)
   e o idioma (`pt_BR`).
4. Clique em **Salvar**.
5. Use **"Enviar mensagem de teste"** com seu próprio número para confirmar que chega certinho.

Pronto — a partir daí, toda vez que um pedido mudar de etapa em `/admin/pedidos`, o cliente recebe
a mensagem automaticamente pelo WhatsApp oficial da loja.

## Perguntas comuns

**Preciso pagar alguma coisa?** As primeiras 1.000 conversas por mês são gratuitas. Depois disso, a
Meta cobra por mensagem de template enviada (o valor varia por país). Mensagens de resposta dentro
de uma conversa já aberta pelo cliente (24h) não usam template e costumam ser gratuitas.

**O bot responde o cliente?** Não — esta versão só **envia avisos automáticos**. Se o cliente
responder, cai no WhatsApp normal da loja (o mesmo número, aberto no celular/WhatsApp Business App
de quem atende), não neste sistema.

**Posso usar meu número de WhatsApp pessoal?** Não. Um número que entra na Cloud API não pode mais
ser usado no app comum do WhatsApp nem no WhatsApp Business App — use um número novo, só para isso.
