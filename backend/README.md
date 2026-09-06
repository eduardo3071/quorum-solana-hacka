# Quórum

Tesouraria com quórum para entidades estudantis brasileiras.

O dinheiro da atlética fica num cofre que exige **duas assinaturas de três**
para qualquer saída, e o livro-caixa é **aberto aos associados, sem login**.
Cofre 2-de-3 na Solana devnet (Squads v4) e livro-caixa público.

As regras que o código não quebra estão em [`CLAUDE.md`](CLAUDE.md). O design
está fechado: as pranchas em `design/` são a especificação, e `design/TOKENS.md`
traz os tokens aplicados em `app/globals.css`.

---

## Rodar na sua máquina

```bash
npm install
cp .env.example .env.local     # preencha, veja a tabela abaixo
npm run chaves                 # gera os três signatários da devnet
# cole cada endereço em https://faucet.solana.com (rede: devnet)
npm run saldo                  # confere se o faucet caiu
npm run seed                   # popula o banco com o cenário do vídeo
npm run dev
```

O cofre na rede é criado pela tela de aprovações (`?estado=vivo`) ou pelo
terminal:

```bash
npm run ciclo                  # cria o cofre, propõe, assina, executa
```

## Variáveis de ambiente

| Variável | Onde | O que é |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | chave anônima, protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **servidor** | ignora RLS — vazou, acabou |
| `SOLANA_RPC_URL` | **servidor** | RPC dedicado de devnet |
| `SIGNER_TESOUREIRA` · `PRESIDENTE` · `CONSELHO` | **servidor** | chaves em base58, só devnet |
| `NEXT_PUBLIC_SITE_URL` | público | endereço de produção, para o link do e-mail voltar certo |
| `SIGNER_COMPRADOR` | servidor | opcional — quem paga o ingresso na demonstração |
| `COTACAO_CENTAVOS_POR_SOL` | servidor | opcional — cotação da demonstração, padrão 10000000 |
| `ORIGENS_PERMITIDAS` | servidor | origens liberadas para chamar `/api/*` de outro domínio |

Nada sensível leva o prefixo `NEXT_PUBLIC_`. O bundler remove do browser tudo
que não tem esse prefixo, e `lib/env.ts` estoura no boot dizendo qual variável
falta — em vez de virar um 401 obscuro três telas adiante.

## Publicar na Vercel

1. **Importe o repositório** em vercel.com. O Next é detectado sozinho; não há
   configuração de build para mexer.
2. **Cadastre as variáveis** da tabela acima em Settings → Environment
   Variables, para Production e Preview. Marque `NEXT_PUBLIC_SITE_URL` com o
   domínio final, com `https://` e sem barra no fim.
3. **Autorize o domínio no Supabase**: Authentication → URL Configuration.
   Ponha o domínio em *Site URL* e adicione `https://SEU-DOMINIO/auth/confirmar`
   em *Redirect URLs*. Sem isso o link do e-mail devolve a pessoa para
   `localhost` — é a falha número um de quem publica.
4. **Aplique as migrações** de `supabase/migrations/` no projeto, em ordem, se
   o banco for outro.
5. `npm run seed` apontando para o banco de produção, se quiser o cenário do
   vídeo lá.

### As três coisas que quebram na Vercel e não na sua máquina

**Endpoint de Solana no runtime edge.** As bibliotecas usam APIs de Node e
falham com erro obscuro de módulo. Todo Route Handler que toca a rede declara
`export const runtime = 'nodejs'`. Se criar um novo, declare também.

**Link do e-mail voltando para `localhost`.** Acontece quando a origem é
montada do cabeçalho `host` e a URL de produção não está na lista de redirect
do Supabase. `lib/acoes.ts` prefere `NEXT_PUBLIC_SITE_URL`, depois o domínio
que a Vercel injeta, e só então o cabeçalho — mas o Supabase recusa qualquer
URL fora da lista, então o passo 3 acima não é opcional.

**RPC público estrangulando no meio da gravação.** O RPC público de devnet
limita por requisições e derruba a demonstração na pior hora. Em produção
`SOLANA_RPC_URL` é obrigatório: sem ele, `conexao()` estoura com uma frase que
diz o que fazer, em vez de virar 429 intermitente.

## Rotas

| Rota | Prancha | Acesso |
| --- | --- | --- |
| `/estilo` | folha de estilo | conferência |
| `/e/[slug]` | 5a-cofre | privada, com abas |
| `/e/[slug]/aprovacoes` | 5b-aprovações | privada, com abas |
| `/e/[slug]/propor` | — | privada, só diretoria |
| `/e/[slug]/festas` | — | privada, com abas |
| `/e/[slug]/socios` | — | privada, com abas |
| `/e/[slug]/livro` | 5c-livro-caixa | **pública, sem login** |
| `/f/[slug]` | 5d-página da festa | pública |
| `/perfil` | 5e-perfil | privada, com abas |

`?estado=vivo` em `/e/[slug]/aprovacoes` troca o painel pelo que fala com a
devnet de verdade.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` · `build` · `start` | Next |
| `npm run typecheck` | TypeScript, sem emitir |
| `npm run seed` | popula o banco (`-- --forcar` refaz do zero) |
| `npm run conferir <rota>` | layout e acessibilidade da rota, contra as regras do `CLAUDE.md` |
| `npm run nada-mockado` | varre o app inteiro atrás de link morto, controle decorativo e dado de mentira |
| `npm run chaves` | gera os três signatários da devnet |
| `npm run saldo` | saldo em SOL dos signatários |
| `npm run setup` · `ciclo` · `assinar` · `executar` | o cofre pelo terminal |

`conferir` roda com o servidor de pé e sai com código 1 se alguma regra falhar,
então serve em CI:

```bash
npm run dev &
npm run conferir /e/aaaeng/livro
```

## Interface em outro domínio

As telas deste repositório são completas e funcionam sozinhas. Se a interface
for construída fora — no Lovable, por exemplo —, este app vira a **API** e o
outro domínio vira a **interface**:

- `docs/API.md` — o contrato dos endpoints e o que o RLS deixa cada um ler.
- `docs/BRIEF-lovable.md` — briefing pronto para colar, com tokens, regras e
  vocabulário.

Cadastre a origem em `ORIGENS_PERMITIDAS` e o domínio nos *Redirect URLs* do
Supabase, senão o link do e-mail não volta.

As bibliotecas da rede e as chaves privadas continuam **só no servidor**. É por
isso que os endpoints existem: o front pede, o servidor assina. Chave privada
no bundle do front é chave publicada.

## Sobre o pagamento

**Em produção esta etapa é Pix**, por parceiro autorizado: o comprador lê um QR
de Pix, o dinheiro cai em conta de pagamento da entidade e o parceiro converte
o saldo para o cofre. O desenho é idêntico — referência única por compra,
conciliação por essa referência, lançamento automático no livro-caixa. Muda
quem custodia e quem confirma.

**Neste repositório o pagamento acontece em devnet**, porque é o que dá para
demonstrar de ponta a ponta sem intermediário autorizado. Por isso nenhum
componente de execução afirma que é Pix. Ver o cabeçalho de `lib/pagamento.ts`.

Rede: **devnet, sempre**. `conexao()` recusa qualquer RPC de mainnet.

---

O bundle original do Claude Design está em `project/`, e o histórico das
decisões de design em `chats/`.
