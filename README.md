# Quórum

Tesouraria com quórum para entidades estudantis brasileiras — atléticas,
comissões de formatura, empresas juniores.

O dinheiro da entidade fica num cofre que exige **duas assinaturas de três**
para qualquer saída, e o **livro-caixa é aberto aos associados, sem login**.

O problema que resolve: hoje o dinheiro da atlética passa pela conta pessoal do
tesoureiro, e ninguém consegue conferir nada.

## Duas partes, um repositório

```
/            interface · React + Vite · roda no navegador
/api         API · Next · assina no cofre, guarda as chaves
```

Estavam em repositórios separados porque cada ferramenta quer a raiz para si.
Agora é um `main` só, com as duas histórias preservadas.

| parte | quem constrói | onde publica | quem abre |
| --- | --- | --- | --- |
| raiz | Lovable | `*.lovable.app` | **as pessoas** |
| `api/` | Vercel, com **Root Directory = `api`** | `*.vercel.app` | o navegador delas |

A separação **não é organização, é segurança**: as bibliotecas da rede e as três
chaves privadas dos signatários não podem ir para o navegador. Chave privada no
pacote do front é chave publicada. O front pede, o servidor assina.

O contrato entre os dois está em [`docs/API.md`](docs/API.md).

## Rodar

```bash
# interface
npm install
cp .env.example .env
npm run dev                 # http://localhost:8080

# API, noutro terminal
cd api
npm install
cp .env.example .env.local
npm run chaves              # gera os três signatários da devnet
npm run seed                # popula o banco com o cenário do vídeo
npm run dev                 # http://localhost:3000
```

Com os dois de pé, ponha `VITE_API_URL=http://localhost:3000` no `.env` da raiz.

### Variáveis

Na raiz, tudo público — protegido pela política de acesso do banco, não pelo
segredo da chave:

| variável | o que é |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave anônima |
| `VITE_API_URL` | **deixe em branco** — o padrão já é o endereço da API |

Em `api/`, o que não pode sair do servidor: `SUPABASE_SERVICE_ROLE_KEY`,
`SOLANA_RPC_URL` e as três `SIGNER_*`. Detalhes em
[`api/README.md`](api/README.md).

**A `service_role` nunca entra na raiz.** Ela ignora toda política de acesso; no
navegador seria o banco inteiro aberto.

### Os dois endereços não são o mesmo

```
https://…lovable.app    ← a INTERFACE · é este o link que se manda
https://…vercel.app     ← a API · abre uma página que diz "Isto é a API"
```

**O endereço da Vercel nunca vai mostrar o Quórum, e isso está certo.** Aquele
projeto tem *Root Directory* = `api`, e `api/` não contém tela nenhuma — só os
Route Handlers. A página que ele serve existe para dizer isso em voz alta: a
dúvida "por que a interface está errada?" já custou três idas e vindas.

Quem demonstra o produto abre o `.lovable.app`. O `.vercel.app` é a porta que o
navegador chama por baixo, sozinho, quando alguém assina ou executa.

O nome é parecido e a troca é fácil. O domínio da interface não tem
`/api/estado` nem `/api/executar`: apontar `VITE_API_URL` para ele faz toda
chamada do cofre receber o `index.html` de volta. O código avisa no console
quando os dois coincidem, e resposta sem JSON vira uma mensagem que nomeia a
variável errada.

O endereço da interface vai em dois lugares, esses sim obrigatórios:
`ORIGENS_PERMITIDAS` no ambiente da API, e os *Redirect URLs* do Supabase.

## Telas

| rota | acesso |
| --- | --- |
| `/` | pública — capa, com o formulário de entrada |
| `/entrar` | pública |
| `/e/:slug` | privada · cofre |
| `/e/:slug/aprovacoes` | privada · a tela do vídeo |
| `/e/:slug/aprovacoes?estado=vivo` | privada · o cofre na rede, de verdade |
| `/e/:slug/propor` | privada · só diretoria |
| `/e/:slug/festas` · `/socios` | privada |
| `/e/:slug/livro` | **pública, sem login** |
| `/f/:slug` | **pública, sem login** |
| `/perfil` | privada |

O livro-caixa e a página da festa abrem sem conta nenhuma. É a tese do produto —
não coloque login na frente delas.

## O que roda na rede, e onde

Nada aqui é simulado. Os dois pedaços que tocam a Solana usam protocolo de
verdade, em devnet, e dá para conferir cada um no explorador.

**Squads v4 — o cofre.** O multisig 2-de-3 é criado por `multisigCreateV2`, a
saída vira `vaultTransactionCreate` + `proposalCreate`, cada assinatura é um
`proposalApprove` e a execução é `vaultTransactionExecute`. Quando falta quórum,
quem recusa é o programa on-chain: erro **6008**, `InvalidProposalStatus` —
proposta em `Active` onde se exigia `Approved`. A interface não finge a recusa,
ela mostra a que veio da rede.

> `npm run ciclo`, em `api/`, faz esse trajeto inteiro no terminal em sete
> passos e imprime o comprovante. O quinto passo **tem** que falhar: é o
> quórum funcionando.

**Solana Pay — a venda de ingresso.** O QR carrega uma Transfer Request de
verdade, `solana:<cofre>?amount=…&reference=…&label=…&message=…`, e o destino é
o **vault PDA da entidade** — o dinheiro do ingresso cai direto no cofre 2-de-3,
sem passar por conta de ninguém. A conciliação é a canônica do protocolo: a
referência viaja na transação como conta somente-leitura, e
`getSignaturesForAddress(referência)` a encontra depois. Ninguém digita "paguei".

O vocabulário desses dois parágrafos vive **aqui e no pitch**, nunca na
interface: para o associado da atlética, é cofre, assinatura e livro-caixa.

## As regras que o código não quebra

Estão em [`CLAUDE.md`](CLAUDE.md), e valem para as duas partes. As que mais
custam quando se esquece:

- **Dinheiro é integer em centavos.** Nunca float, nem em variável
  intermediária: `19.99 * 100` dá `1998.9999999999998`.
- **Falta de quórum não é erro.** `/api/executar` responde 200 com
  `bloqueado: true`, e a tela mostra o bloco vermelho desenhado. Um `catch`
  genérico ali destrói a demonstração.
- **Nenhuma palavra de blockchain na interface**, e **nenhum "Pix" nos
  componentes de execução**. O pagamento roda em devnet; em produção seria Pix
  por parceiro autorizado, e dizer que já é seria mentir para quem avalia.
- **DARK-ONLY.** O design está fechado: as pranchas em `design/` são a
  especificação.

## Conferir

Cada parte tem os seus, e os dois saem com código 1 se algo falhar:

```bash
# interface
npm run build && npx vite preview --port 8080 &
npm run conferir /e/aaaeng/livro    # layout e acessibilidade
npm run nada-mockado                # link morto, controle decorativo, dado falso

# API
cd api && npm run acesso            # quem pode chamar cada endpoint
```

`conferir` mede sobreposição de texto, chip quebrado em duas linhas, valor
partido no meio, transbordo, foco visível, nome de controle e contraste WCAG AA.

`nada-mockado` abre cada tela, segue cada link e reprova destino que responde
erro ou cai em "não encontrado" — mais ícone de ação sem ação e campo fora de
formulário.

`acesso` sobe um Supabase de mentira e bate nos quatro endpoints do cofre com
sete crachás diferentes — sem token, token podre, associado, signatário de
outra entidade — conferindo o código de cada recusa. Não toca na devnet.
