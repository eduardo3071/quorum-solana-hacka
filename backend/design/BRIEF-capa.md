# Briefing para o Claude Design · prancha da capa

A capa (`/`) é a única tela do Quórum que nunca foi desenhada — nasceu como
lista de atalhos para navegar durante o desenvolvimento e ficou. Este arquivo é
o pedido para o Claude Design fechar essa lacuna, no mesmo sistema das pranchas
5a–5e.

Copie daqui para baixo.

---

## O que é o Quórum

Tesouraria para entidades estudantis brasileiras — atléticas, comissões de
formatura, empresas juniores. O dinheiro da entidade fica num **cofre que exige
duas assinaturas de três** para qualquer saída, e o **livro-caixa é aberto aos
associados, sem login**.

O problema que ele resolve: hoje o dinheiro da atlética passa pelo Pix pessoal
do tesoureiro, e ninguém consegue conferir nada.

## O que eu preciso

Uma prancha nova: **a capa** — a primeira tela de quem abre o app sem estar
logado. Chame de `5f-capa.png`.

O design do produto já está fechado. As pranchas existentes (4a folha de
estilo, 5a cofre, 5b aprovações, 5c livro-caixa, 5d página da festa, 5e perfil)
são a especificação, e esta precisa parecer irmã delas — mesmos tokens, mesma
tipografia, mesmas formas. **Estou anexando todas.** Olhe antes de começar.

## O que está errado hoje

Quatro cartões idênticos, um embaixo do outro, com um título e um rótulo
cinza cada. Nenhuma hierarquia: "Ir para o cofre" e "Folha de estilo" têm
exatamente o mesmo peso. Nenhum tile de ícone — que é a assinatura visual do
sistema em todas as outras telas. Nenhum hero. Nada que diga o que o produto é
para quem chega pela primeira vez.

Parece a tela de índice de um projeto pela metade, e é a primeira coisa que um
avaliador de hackathon vê.

## O que a capa precisa fazer

Em ordem de importância:

1. **Dizer o que é o produto em três segundos.** Quem chega não sabe o que é
   Quórum. O nome sozinho não conta nada.
2. **Mostrar a regra que é a tese**: duas assinaturas de três para qualquer
   saída. Isto merece ser *visto*, não só lido — o indicador de assinaturas da
   5b (avatares + o tracejado do que falta) é o componente que comunica isso.
3. **Levar para dentro**: entrar por link no e-mail, sem senha.
4. **Mostrar as duas portas abertas**, que são a prova do discurso: o
   livro-caixa público e a página da festa abrem **sem conta nenhuma**. Um
   avaliador vai clicar nisso antes de tentar entrar. Elas não podem estar no
   rodapé como notas de rodapé.

## Estados

**Visitante (o principal).** É o que descrevi acima.

**Sem entidade.** Alguém entrou com um e-mail que a diretoria não cadastrou.
Não é erro — é convite pendente. Precisa de um estado que diga isso sem parecer
falha, e que ofereça sair.

Quem já entrou e tem entidade não vê a capa: vai direto para o cofre. Não
precisa desenhar.

## Restrições que não se quebram

**Formato.** 390px de largura. Uma tela de celular, rolagem vertical.

**DARK-ONLY.** Não existe tema claro. Não crie alternador. O fundo é
azul-marinho, **nunca preto** — foi essa correção que fez a interface parar de
parecer chapada.

**Nenhum emoji.** Em lugar nenhum.

**Vocabulário.** Nenhuma palavra de blockchain na interface. Não existe
"carteira", "wallet", "on-chain", "multisig", "transação", "token", "Solana".
As palavras do produto são: cofre, assinatura, saída, entrada, livro-caixa,
rubrica, proposta, quórum, comprovante, retido.

Também **não diga "Pix"**. O pagamento da demonstração não é Pix, e afirmar que
é seria mentir para quem avalia.

"Rubrica" significa categoria contábil (Eventos, Marketing, Esporte,
Associados). Nunca sinônimo de assinatura.

**Interface em pt-BR.** Datas e dinheiro em pt-BR.

### Cor

| token | hex | uso |
| --- | --- | --- |
| `ground` | `#101823` | fundo da tela |
| `surface` | `#192434` | cartões |
| `surface-2` | `#1F2D41` | elevação |
| `line` | `#243448` | bordas |
| `tabbar` | `#141E2C` | barra inferior |
| `ink` | `#FFFFFF` | títulos, valores |
| `ink-2` | `#9AA9BD` | apoio |
| `ink-3` | `#6B7C93` | rótulos, datas |

Acentos, cada um com seu fundo tingido:

| token | acento | tingido | uso |
| --- | --- | --- | --- |
| `blue` | `#1FA5FF` | `#1A3852` | ação, navegação, links |
| `green` | `#32C869` | `#173B2E` | entrada de dinheiro, confirmado |
| `amber` | `#F5C73D` | `#3A3018` | espera, progresso |
| `purple` | `#AF57DB` | `#2F2C4D` | pessoas, associados |
| `red` | `#FF5F6D` | `#3A1C24` | retido, recusado, erro |

Hero: gradiente 160°, `#1E88E5 → #29A3F5 → #1B7FD4`, com textura de formas
orgânicas claras a 16% de opacidade **atrás** do conteúdo — nunca por cima das
pílulas.

**As regras de cor:** `red` só em bloqueio, recusa e erro — nunca em avatar de
pessoa. `green` só em entrada de dinheiro e confirmação. `amber` só em espera.
`blue` só em ação e link — nunca em saldo. **No máximo duas cores semânticas
visíveis por tela.**

O **tile tingido** — quadrado arredondado com o fundo do acento e o ícone na
cor do acento — é a assinatura visual do sistema. É ele que dá vida sem poluir.
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

Cartão 16px · botão 13px · tile de ícone 10–12px · avatar 11px · chip 7px.
Sem sombra. Margem lateral 16px. Espaço entre cartões 10–11px.

### Layout

- Nunca `position: absolute` para posicionar conteúdo.
- Nunca altura fixa em cartão ou linha de lista. Use `min-height`.
- Pílula, chip e etiqueta **nunca quebram em duas linhas**. Se não couber,
  encurte o texto.
- Números longos nunca quebram no meio.
- Nenhum texto se sobrepõe a outro. Quando não couber, empurre para a linha
  seguinte.

### Contraste

Texto pequeno precisa de 4,5:1 sobre o fundo em que está. `ink-3` (`#6B7C93`)
fica em 3,67:1 sobre `surface` — **não use `ink-3` para texto que a pessoa
precise ler**, só para rótulo curto e acessório. Se um texto importa, é `ink-2`
ou `ink`.

## Entrega

Uma prancha `.dc.html` de 390px, no mesmo padrão das outras, com os dois
estados (visitante e sem entidade). Se quiser propor variação de composição,
mande duas e eu escolho.

Não invente número: não existe "1.200 entidades usando" nem depoimento. É um
protótipo de hackathon, e número inventado numa capa é a primeira coisa que um
avaliador testa.
