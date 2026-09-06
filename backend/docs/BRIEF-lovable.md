# Briefing para o Lovable

Como usar: cole tudo abaixo da linha divisória numa mensagem só. Anexe junto
`docs/API.md` e as pranchas de `design/` (4a e 5a–5e). Sem as pranchas o Lovable
reinventa o sistema visual e você perde uma rodada inteira.

---

Construa a interface do **Quórum**: tesouraria para entidades estudantis
brasileiras — atléticas, comissões de formatura, empresas juniores.

O dinheiro da entidade fica num **cofre que exige duas assinaturas de três**
para qualquer saída, e o **livro-caixa é aberto aos associados, sem login**.

O problema que resolve: hoje o dinheiro da atlética passa pela conta pessoal do
tesoureiro, e ninguém consegue conferir nada. Quem sai da diretoria leva o
histórico junto.

## O que já existe — você NÃO vai construir isto

O backend está pronto, no ar e com dados de verdade. Você constrói **só a
interface**.

- **API:** `https://solana-hacka-university.vercel.app` — contrato completo em
  `docs/API.md`, que estou anexando. **Leia inteiro antes da primeira linha de
  código.**
- **Banco:** Supabase com RLS ligado em toda tabela. Leia direto com
  `@supabase/supabase-js` e a chave anônima. Ela é pública por natureza; quem
  protege os dados é a política, não o segredo da chave.
- **Entrar:** link por e-mail, sem senha (`signInWithOtp`).

Use `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, que já estão no
projeto. **A chave `service_role` nunca entra no front, em hipótese nenhuma.**

As bibliotecas da rede e as chaves privadas dos signatários vivem só no
servidor. É por isso que a API existe: o front pede, o servidor assina.

## O banco

Dinheiro é **integer em centavos** em toda coluna `*_centavos`.

| tabela | colunas |
| --- | --- |
| `entidades` | id, nome, slug, tipo, universidade, multisig_pda, publico, criado_em |
| `membros` | id, entidade_id, user_id, nome, papel, pubkey, ativo, email |
| `eventos` | id, entidade_id, nome, slug, data, local, capacidade, rubrica |
| `lotes` | id, evento_id, nome, preco_centavos, total, vendidos, ordem |
| `ingressos` | id, evento_id, lote_id, lote, preco_centavos, comprador_id, status, referencia, lamports, tx_signature, lancamento_id, pago_em, reservado_em |
| `lancamentos` | id, entidade_id, tipo, valor_centavos, rubrica, descricao, tx_signature, criado_em |
| `propostas` | id, entidade_id, criado_por, destino, chave_pix, valor_centavos, rubrica, tx_index, status, criado_em |
| `assinaturas` | id, proposta_id, membro_id, assinado_em, tx_signature |

Enumerações: `papel` = presidente · tesoureiro · conselho · socio ·
`tipo_lancamento` = entrada · saida · `status_proposta` = pendente · aprovada ·
executada · rejeitada · `status_ingresso` = reservado · pago · usado ·
`rubrica` = Eventos · Marketing · Esporte · Associados.

**O que a política deixa passar:**

| tabela | anônimo | autenticado |
| --- | --- | --- |
| `entidades` | só `publico = true` | as próprias, também |
| `eventos`, `lotes` | tudo | tudo |
| `lancamentos` | de entidade pública | da própria entidade |
| `membros`, `propostas`, `assinaturas` | **nada** | da própria entidade |
| `ingressos` | **nada** | os próprios; diretoria vê os da entidade |

Escrita de dinheiro **não tem política para ninguém**: lançamento e mudança de
status nascem no servidor, depois que a rede confirmou. O front pode inserir
`propostas` e `assinaturas` em nome próprio — a política exige que
`criado_por` / `membro_id` seja o registro do próprio usuário e que o papel não
seja `socio`. Sócio não assina.

**Dados que já estão lá:** A.A.A. Engenharia (`aaaeng`), 62 associados sendo 3
signatários, 7 lançamentos fechando em R$ 43.180,25 de saldo, 3 propostas
retidas somando R$ 12.400,00 — uma delas com 1 de 2 assinaturas —, o Baile de
Aniversário 32 anos (`aaaeng-baile32`) com 3 lotes e 8 ingressos vendidos.

## As telas

| tela | rota | acesso |
| --- | --- | --- |
| Capa | `/` | pública |
| Entrar | `/entrar` | pública |
| Cofre | `/e/:slug` | privada, com abas |
| Aprovações | `/e/:slug/aprovacoes` | privada, com abas |
| Propor saída | `/e/:slug/propor` | privada, só diretoria |
| Festas | `/e/:slug/festas` | privada, com abas |
| Sócios | `/e/:slug/socios` | privada, com abas |
| Livro-caixa | `/e/:slug/livro` | **pública, sem login, sem abas** |
| Página da festa | `/f/:slug` | pública, sem abas |
| Perfil | `/perfil` | privada, com abas |

Barra de abas: **Cofre · Aprovar · (botão flutuante +) · Festas · Perfil**. O
botão central leva a `/e/:slug/propor`. O livro-caixa e a página da festa **não
têm abas** — circulam em grupo de WhatsApp, para gente que não tem conta.

### Capa

Nesta ordem, que não é acidental: o que o produto é · a regra que o sustenta,
mostrada com o indicador de assinaturas e não só descrita · o campo de entrar ·
as duas portas que abrem sem conta (livro-caixa e a próxima festa).

Quem já entrou e tem entidade vai direto ao cofre, sem parada. Quem entrou e
não tem entidade vê **convite pendente** — hero âmbar, nunca vermelho: a pessoa
fez tudo certo, só não foi cadastrada ainda.

### Aprovações — a tela do vídeo

Uma saída proposta, uma assinatura dada, faltando a segunda. Mostra destino,
chave, valor, rubrica, quem propôs e quando, o indicador de assinaturas e o
bloco de bloqueio.

Quando alguém tenta executar sem quórum, a API responde **200** com
`{ bloqueado: true, assinaturasFeitas, assinaturasNecessarias, saldoCaixa }`.

> **Isso não é erro e não pode virar tela de erro.** É a regra do cofre
> funcionando, e é a coisa que o produto inteiro existe para mostrar: um bloco
> vermelho desenhado, com a contagem de assinaturas e a frase de que nenhum
> valor saiu do cofre. Um `catch` genérico aqui destrói a demonstração.
>
> Erro de verdade — rede fora do ar — vem como **503** e tem outra tela.

### Propor saída

Para quem · chave do destinatário · valor em reais · rubrica. O valor é digitado
como texto e convertido para centavos **uma vez só**, no envio. Sócio que abrir
esta tela vê que a proposta é da diretoria, e não um formulário que vai falhar
no fim.

### Página da festa — o circuito que fecha

Escolher lote → comprar → QR e referência → esperar → confirmado.

O QR vem **desenhado do servidor** como texto SVG no campo `qr`; insira no DOM e
não carregue biblioteca de QR nenhuma. Enquanto espera, consulte
`POST /api/conciliar` a cada 2 ou 3 segundos — é idempotente.

O **livro-caixa se atualiza sozinho**: quem compra numa aba vê a entrada
aparecer na outra em menos de 30 segundos, sem recarregar.

### Livro-caixa

Totais no topo, busca e filtro por rubrica, extrato. **Busca e filtro precisam
funcionar** — se forem enfeite, tire-os da tela. O filtro vive na URL
(`?rubrica=Eventos&busca=ônibus`), para o livro filtrado ser um link que se
manda no grupo.

## Restrições que não se quebram

**DARK-ONLY.** Não existe tema claro. Não crie alternador. O fundo é
azul-marinho, **nunca preto**.

**Mobile-first, 390px.** As pranchas são 390 × 844; acima disso o conteúdo fica
centrado nessa largura.

**Nenhum emoji.** Em lugar nenhum.

**Interface em pt-BR.** Datas e dinheiro em pt-BR.

### Vocabulário

**Nenhuma palavra de blockchain na interface.** Não existe "carteira", "wallet",
"on-chain", "multisig", "transação", "token", "Solana", "blockchain", "hash".
As palavras do produto são: **cofre, assinatura, saída, entrada, livro-caixa,
rubrica, proposta, quórum, comprovante, retido**.

**Não diga "Pix" em componente de execução.** O pagamento da demonstração roda
em devnet; em produção seria Pix por parceiro autorizado. Afirmar que é Pix
agora seria mentir para quem avalia. Diga "a saída é executada", nunca "o Pix é
executado".

**"Rubrica" é categoria contábil** — Eventos, Marketing, Esporte, Associados.
Nunca sinônimo de assinatura.

### Dinheiro

Integer em **centavos**, sempre. `valor_centavos: 4318025` é `R$ 43.180,25`.
Nunca float, nem em variável intermediária: `19.99 * 100` dá
`1998.9999999999998`.

- Formate com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Saída usa **`−` (U+2212**, o menos matemático), entrada usa `+`. Nunca hífen.
- `tabular-nums` em todo número, senão a coluna dança quando o valor muda.
- Cartão compacto abrevia sem centavos: `R$ 43.180`. Livro-caixa e comprovante
  mostram completo: `R$ 43.180,25`.

## O sistema visual

### Cor

| token | hex | uso |
| --- | --- | --- |
| `ground` | `#101823` | fundo da tela |
| `surface` | `#192434` | cartões |
| `surface-2` | `#1F2D41` | elevação, botão desabilitado |
| `line` | `#243448` | bordas |
| `tabbar` | `#141E2C` | barra de abas |
| `ink` | `#FFFFFF` | títulos, valores |
| `ink-2` | `#9AA9BD` | apoio |
| `ink-3` | `#6B7C93` | rótulos e datas, **nunca texto que importa** |

| acento | cor | tingido | uso |
| --- | --- | --- | --- |
| `blue` | `#1FA5FF` | `#1A3852` | ação, navegação, links |
| `green` | `#32C869` | `#173B2E` | entrada de dinheiro, confirmado |
| `amber` | `#F5C73D` | `#3A3018` | espera, progresso |
| `purple` | `#AF57DB` | `#2F2C4D` | pessoas, associados |
| `red` | `#FF5F6D` | `#3A1C24` | retido, recusado, erro |

Hero: gradiente 160°, `#1E88E5 → #29A3F5 → #1B7FD4`, com textura de formas
orgânicas claras a 16% **atrás** do conteúdo — nunca por cima das pílulas. O
hero carrega o estado da tela: azul normal · âmbar em curso · verde concluído ·
vermelho retido ou recusado · roxo pessoas. **Sobre âmbar a tinta é escura**,
não branca.

**As regras de cor:** `red` só em bloqueio, recusa e erro — **nunca em avatar de
pessoa**. `green` só em entrada de dinheiro e confirmação. `amber` só em espera.
`blue` só em ação e link — **nunca em saldo**. **No máximo duas cores semânticas
visíveis por tela.**

Rubrica tem cor fixa: Eventos azul · Marketing âmbar · Esporte verde ·
Associados roxo.

O **tile tingido** — quadrado arredondado com o fundo do acento e o ícone na cor
do acento — é a assinatura visual do sistema. É ele que dá vida sem poluir.
Ícones de traço 1.5–1.8.

### Tipografia

Inter, uma família só.

| peso | tamanho | tracking | uso |
| --- | --- | --- | --- |
| 800 | 25–28 | -0.035em | valor-âncora |
| 800 | 23 | -0.03em | título no hero |
| 800 | 16.5 | -0.03em | valor em lista |
| 700 | 16.5 | -0.02em | título de seção |
| 700 | 15.5 | -0.015em | nome de item |
| 600 | 10.5 | 0.09em | rótulo caixa alta |
| 600 | 10.5 | — | chip |
| 500 | 12.5–13 | — | corpo e apoio |
| 400 | 12.5 | — | descrição |

### Forma

Cartão 16px · botão 13px · tile de ícone 10–12px · avatar 11px · chip 7px ·
botão flutuante circular 58px. **Sem sombra**, exceto no botão flutuante.
Margem lateral 16px. Espaço entre cartões 10–11px.

### O componente mais importante

O **indicador de assinaturas**: avatares quadrados de 36px com iniciais. Quem
assinou fica com fundo verde tingido e texto verde; quem falta é contorno
tracejado com um `+`. Ao lado, a contagem em negrito na cor do estado, e a linha
de quem assinou embaixo. Barra de progresso.

Três variantes, derivadas da contagem — sem prop de estado a errar: `0 de 2`
neutro cinza · `1 de 2` âmbar a 50% · completo verde a 100%.

O avatar de quem assinou é verde porque verde é confirmação. **Nunca vermelho:
vermelho não é pessoa.**

### Layout

- Nunca `position: absolute` para posicionar conteúdo. A exceção é o botão
  flutuante da barra de abas.
- Nunca altura fixa em cartão, linha de lista ou passo de linha do tempo. Use
  `min-height`.
- Toda tela com barra de abas reserva **96px livres** no fim da rolagem, senão a
  última ação fica embaixo do botão flutuante.
- Números longos (CNPJ, chave, referência) **nunca quebram no meio**. Se não
  couber, role na horizontal dentro do próprio contêiner.
- Pílula, chip e etiqueta **nunca quebram em duas linhas**. Se não couber,
  encurte o texto.
- Nenhum texto se sobrepõe a outro. Quando não couber, empurre para a linha
  seguinte — **nunca `truncate` em dado que a pessoa precise ler**.
- A página nunca rola na horizontal.

### Acessibilidade

- Foco visível em todo controle: anel de 2px azul, 2px de afastamento. Nunca
  `outline: none` sem substituto.
- Todo controle tem nome. Botão só de ícone precisa de `aria-label`; campo
  precisa de `<label>`, mesmo que visualmente escondido.
- Texto pequeno precisa de 4,5:1 de contraste. `ink-3` fica em 3,67:1 sobre
  `surface` — use só em rótulo curto e acessório.

## Estados que não podem faltar

Toda tela precisa dos três: **carregando** (esqueleto que ocupa o espaço do
conteúdo, não spinner), **vazio** (que ensina o próximo passo, não só informa
que está vazio) e **erro** (em português de gente, dizendo **o que não aconteceu
com o dinheiro** — é a primeira dúvida de quem vê a tela quebrar num app de
tesouraria).

E mais três, específicos deste produto:

- **Saída retida por falta de quórum** — desenhada, nunca um `catch`.
- **Entrou mas não tem entidade** — convite pendente, âmbar, não vermelho.
- **Filtro sem resultado** — diferente de livro-caixa vazio, e com um jeito de
  limpar o filtro.

## Regra final: nada de enfeite que parece controle

Não coloque na tela **nada que pareça clicável e não seja**. Sem caixa de busca
que não busca, sem chip de filtro que não filtra, sem seta de navegação em
linha que não navega, sem botão que leva a uma tela que você não construiu.

Se a funcionalidade não existe, **tire o controle da tela**. Um avaliador clica
exatamente nesses lugares, e um controle morto custa mais caro que a ausência
dele.

Pelo mesmo motivo: **não invente dado**. Nada de "1.200 entidades usando",
depoimento, logo de universidade parceira ou número de fachada. É um protótipo
de hackathon, e dado inventado é a primeira coisa que se testa.

## Como eu vou conferir

1. Todo link leva a uma tela que existe.
2. Todo controle responde ao toque.
3. Falta de quórum mostra o bloco de bloqueio, não erro.
4. Comprar um ingresso faz a entrada aparecer sozinha no livro-caixa aberto em
   outra aba, em menos de 30 segundos.
5. Nenhuma palavra de blockchain e nenhum "Pix" nos componentes de execução.
6. Nenhum valor com centavo errado.
