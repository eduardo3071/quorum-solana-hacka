# Quórum

Tesouraria com quórum para entidades estudantis brasileiras.
Cofre 2-de-3 na Solana (Squads v4) + livro-caixa público.

## Stack

Next.js App Router · TypeScript · Tailwind · shadcn/ui
Supabase (Postgres, Auth, RLS) · Solana devnet · deploy na Vercel

> Estado: shadcn/ui ainda **não** foi instalado — é tarefa do B1.
> Os componentes do sistema (`Hero`, `TileIcone`, `IndicadorAssinaturas`…)
> são próprios, escritos contra as pranchas; shadcn entra só onde couber.

## Design

O design está fechado. As pranchas em `design/` são a especificação:
folha de estilo (4a) · 5a a 5e (telas) · 6a a 6f (estados)

Os tokens estão em `design/TOKENS.md` e aplicados em `app/globals.css`
como `@theme` do Tailwind v4.

O bundle original do Claude Design está em `project/` — a fonte das
pranchas é `project/Quórum - Folha de Estilo.dc.html`, e o histórico de
decisões em `chats/chat1.md`.

O produto é DARK-ONLY. Não existe tema claro. Não crie alternador.

Precedência: as telas 5a-6f mandam sobre a folha de estilo, que ficou
desatualizada em alguns textos.

## Regras que não se quebram

- Dinheiro é integer em CENTAVOS. Nunca float. Nunca.
- Bibliotecas de Solana e chaves privadas só no servidor.
  Route Handlers com `export const runtime = 'nodejs'`.
- Nada sensível em `NEXT_PUBLIC_*`.
- Interface em pt-BR. Datas e moeda em pt-BR.
- NENHUMA palavra de blockchain na interface. O vocabulário é:
  cofre, assinatura, saída, entrada, livro-caixa, rubrica,
  proposta, quórum, comprovante, retido.
- NENHUMA menção a "Pix" nos componentes de execução. O demo roda
  em devnet. Diga "a saída é executada", nunca "o Pix é executado".
- "rubrica" significa categoria contábil (Eventos, Marketing,
  Esporte, Associados). Nunca use como sinônimo de assinatura.
- RLS ligado em toda tabela, sem exceção.
- Rede: devnet. Nunca mainnet neste repositório.
- Erro de execução sem quórum NÃO é exceção a esconder: é um
  estado de interface desenhado (ver `design/5b-aprovacoes.png`).

## Cor

red só em bloqueio/recusa/erro — nunca em avatar de pessoa.
green só em entrada e confirmação. amber só em espera.
blue só em ação e link — nunca em saldo.
No máximo duas cores semânticas visíveis por tela.

## Layout

- Nunca `position: absolute` para posicionar conteúdo. A exceção é
  o botão flutuante da barra de abas.
- Nunca altura fixa em cartão, linha de lista ou passo de timeline.
  Use `min-height`.
- Toda tela com barra de abas reserva 96px livres no fim da rolagem
  (utilitário `respiro-abas`).
- Números longos (CNPJ, chave, hash) nunca quebram no meio.
- Pílula, chip e etiqueta nunca quebram em duas linhas. Se não
  couber, encurte o texto.
- Nenhum texto se sobrepõe a outro. Quando não couber, empurre para
  a linha seguinte.

## Rotas

| Rota | Prancha | Acesso |
| --- | --- | --- |
| `/estilo` | folha de estilo | conferência |
| `/e/[slug]` | 5a-cofre | privada, com abas |
| `/e/[slug]/aprovacoes` | 5b-aprovacoes | privada, com abas |
| `/e/[slug]/livro` | 5c-livro-caixa | **pública, sem login, sem abas** |
| `/f/[slug]` | 5d-pagina-da-festa | pública, sem abas |
| `/perfil` | 5e-perfil-carteirinha | privada, com abas |

6a–6f são estados dessas telas, não rotas de navegação.
