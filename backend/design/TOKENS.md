# Tokens do Quórum

Amostrados das pranchas finais. São os valores reais do desenho, não
aproximações. Aplicados em `app/globals.css` como `@theme` do Tailwind v4 —
este arquivo é a referência legível; o CSS é a fonte de verdade do código.

O fundo é azul-marinho, **nunca preto**. Foi essa a correção que fez a
interface parar de parecer chapada.

## Superfícies

| token | hex | uso |
| --- | --- | --- |
| `ground` | `#101823` | fundo da tela |
| `surface` | `#192434` | cartões |
| `surface-2` | `#1F2D41` | elevação, botão desabilitado |
| `line` | `#243448` | bordas |
| `tabbar` | `#141E2C` | barra de abas |

## Texto

| token | hex | uso |
| --- | --- | --- |
| `ink` | `#FFFFFF` | títulos, valores |
| `ink-2` | `#9AA9BD` | apoio |
| `ink-3` | `#6B7C93` | rótulos, datas |

## Acentos

Cada acento vem com o fundo tingido correspondente. O **tile tingido** —
quadrado arredondado com o fundo do acento e o ícone na cor do acento — é a
assinatura visual do sistema. É ele que dá vida à tela sem poluir.

| token | acento | tingido | uso |
| --- | --- | --- | --- |
| `blue` | `#1FA5FF` | `#1A3852` | ação, navegação, links |
| `green` | `#32C869` | `#173B2E` | entrada de dinheiro, confirmado |
| `amber` | `#F5C73D` | `#3A3018` | espera, progresso |
| `purple` | `#AF57DB` | `#2F2C4D` | pessoas, associados |
| `red` | `#FF5F6D` | `#3A1C24` | retido, recusado, erro |

Hero: gradiente 160°, `#1E88E5 → #29A3F5 → #1B7FD4`, com textura de formas
orgânicas claras a 16% de opacidade. **A textura fica atrás do conteúdo** —
nunca por cima das pílulas.

### A regra de cor que não se quebra

`red` só em bloqueio, recusa e erro — nunca em avatar de pessoa.
`green` só em entrada e confirmação. `amber` só em espera.
`blue` só em ação e link — **nunca em saldo**.
No máximo duas cores semânticas visíveis por tela.

O hero carrega o estado da tela: azul normal e navegação · âmbar em curso ·
verde concluído · vermelho retido, recusado, erro · roxo pessoas e governança.

### Código de cor por rubrica

Fixo em todo o produto. Rubrica é **categoria contábil**, nunca sinônimo de
assinatura.

| rubrica | cor |
| --- | --- |
| Eventos | azul |
| Marketing | âmbar |
| Esporte | verde |
| Associados | roxo |

Estados de proposta: Executada verde · Aguardando âmbar · Retida vermelho.

## Tipografia

Inter, uma família só. Utilitários em `globals.css`.

| peso | tamanho | tracking | uso | utilitário |
| --- | --- | --- | --- | --- |
| 800 | 25–28 | -0.035em | valor-âncora | `t-ancora`, `t-ancora-sm` |
| 800 | 23 | -0.03em | título no hero | `t-hero` |
| 800 | 16.5 | -0.03em | valor em lista | `t-valor` |
| 700 | 16.5 | -0.02em | título de seção | `t-secao` |
| 700 | 15.5 | -0.015em | nome de item | `t-item` |
| 600 | 10.5 | 0.09em | rótulo caixa alta | `t-rotulo` |
| 600 | 10.5 | — | chip | `t-chip` |
| 500 | 12.5–13 | — | corpo e apoio | `t-corpo` |
| 400 | 12.5 | — | descrição | `t-desc` |

## Forma

| elemento | raio |
| --- | --- |
| cartão | 16px |
| botão | 13px |
| tile de ícone | 10–12px |
| avatar | 11px |
| chip | 7px |
| botão flutuante | circular, 58px |

Sem sombra, exceto no botão flutuante central.
Margem lateral 16px. Espaço entre cartões 10–11px.
Ícones de traço 1.5–1.8. **Nenhum emoji na interface.**

## Números

`tabular-nums` sempre. Dinheiro em pt-BR, guardado em **centavos como
inteiro**. Entrada com `+`, saída com `−` (U+2212, menos matemático, não
hífen).

Em cartão compacto, abrevie sem centavos: `R$ 43.180`.
No livro-caixa e em comprovante, valor completo: `R$ 43.180,25`.

## Pranchas

| arquivo | tela |
| --- | --- |
| `4a-folha-de-estilo.png` | sistema: tipografia, paleta, componentes |
| `5a-cofre.png` | cofre da entidade |
| `5b-aprovacoes.png` | aprovações — a tela do vídeo |
| `5c-livro-caixa.png` | livro-caixa público |
| `5d-pagina-da-festa.png` | página da festa |
| `5e-perfil-carteirinha.png` | perfil e carteirinha |
| `6a-cofre-vazio.png` | onboarding em três passos |
| `6b-proposta-recusada.png` | recusa com motivo |
| `6c-saida-executada.png` | comprovante |
| `6d-executando.png` | linha do tempo de 4 passos |
| `6e-erro-de-rede.png` | offline com assinatura na fila |
| `6f-troca-de-diretoria.png` | rotação de signatários |

> **Ressalva.** Na folha de estilo, os componentes de bloqueio ainda diziam
> "Executar Pix" e "o Pix só é executado…", enquanto a tela 5b já estava
> corrigida para "a saída é executada". As telas mandam. Se um componente for
> copiado da folha de estilo, o erro volta.
