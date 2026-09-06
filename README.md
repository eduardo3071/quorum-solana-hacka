# Quórum · interface

Tesouraria com quórum para entidades estudantis brasileiras.

O dinheiro da entidade fica num cofre que exige **duas assinaturas de três**
para qualquer saída, e o **livro-caixa é aberto aos associados, sem login**.

Este repositório é a **interface**: React + Vite, sem servidor. Ele roda inteiro
no navegador e fala com dois lugares.

## A arquitetura, em três linhas

| onde | o quê |
| --- | --- |
| **este repositório** | as telas |
| **Supabase** | leitura do banco, direto do navegador, sob RLS |
| **a API** | assinar no cofre, executar saída, vender ingresso |

A API é o repositório
[`Solana-Hacka-University`](https://github.com/eduardo3071/Solana-Hacka-University),
publicado na Vercel. Ela existe porque as bibliotecas da rede e as três chaves
privadas dos signatários **não podem ir para o navegador** — chave privada no
pacote do front é chave publicada. O front pede, o servidor assina.

Contrato dos endpoints: `docs/API.md` naquele repositório.

## Rodar

```bash
npm install
cp .env.example .env      # preencha
npm run dev               # http://localhost:8080
```

| variável | o que é |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave anônima — pública por natureza, protegida por RLS |
| `VITE_API_URL` | **deixe em branco** — o padrão já é o endereço da API |

**A chave `service_role` nunca entra aqui.** Ela ignora toda política de acesso;
no navegador seria o banco inteiro aberto.

### Os dois endereços não são o mesmo

```
https://solana-hacka-university.lovable.app   ← a interface (este projeto)
https://solana-hacka-university.vercel.app    ← a API (o app Next)
```

O nome é parecido e a confusão é fácil. O domínio da interface **não tem**
`/api/estado` nem `/api/executar`: apontar `VITE_API_URL` para ele faz toda
chamada do cofre receber o `index.html` de volta. Por isso o código avisa no
console quando as duas coincidem, e a resposta sem JSON vira uma mensagem que
diz exatamente qual variável está errada.

O endereço da interface vai em dois outros lugares, esses sim obrigatórios:
`ORIGENS_PERMITIDAS` no ambiente da API, e os *Redirect URLs* do Supabase.

Para o link do e-mail voltar certo, o domínio precisa estar em **Authentication
→ URL Configuration → Redirect URLs** no painel do Supabase. E para o front
poder chamar a API de outro domínio, a origem precisa estar em
`ORIGENS_PERMITIDAS` no ambiente da API.

## Telas

| rota | acesso |
| --- | --- |
| `/` | pública — capa, com o formulário de entrada |
| `/entrar` | pública |
| `/e/:slug` | privada · cofre |
| `/e/:slug/aprovacoes` | privada · a tela do vídeo |
| `/e/:slug/aprovacoes?estado=vivo` | privada · o cofre na rede, de verdade |
| `/e/:slug/propor` | privada · só diretoria |
| `/e/:slug/festas` | privada |
| `/e/:slug/socios` | privada |
| `/e/:slug/livro` | **pública, sem login** |
| `/f/:slug` | **pública, sem login** |
| `/perfil` | privada |

O livro-caixa e a página da festa abrem sem conta nenhuma. É a tese do produto —
não coloque login na frente delas.

## As regras que o código não quebra

- **Dinheiro é integer em centavos.** Nunca float, nem em variável
  intermediária: `19.99 * 100` dá `1998.9999999999998`.
- **Saída usa `−` (U+2212)**, o menos matemático. Entrada usa `+`.
- **Nenhuma palavra de blockchain na interface.** O vocabulário é: cofre,
  assinatura, saída, entrada, livro-caixa, rubrica, proposta, quórum,
  comprovante, retido.
- **Nenhuma menção a "Pix" nos componentes de execução.** O pagamento da
  demonstração roda em devnet; em produção seria Pix por parceiro autorizado.
  Diga "a saída é executada", nunca "o Pix é executado".
- **Falta de quórum não é erro.** `/api/executar` responde 200 com
  `bloqueado: true`, e a tela mostra o bloco vermelho desenhado. Um `catch`
  genérico ali destrói a demonstração.
- **DARK-ONLY.** Não existe tema claro, não existe alternador.
- `red` só em bloqueio, recusa e erro — nunca em avatar de pessoa. `green` só em
  entrada e confirmação. `amber` só em espera. `blue` só em ação e link.

## Conferir

Os dois verificadores rodam com o app de pé e saem com código 1 se algo falhar:

```bash
npm run build && npx vite preview --port 8080 &
npm run conferir /e/aaaeng/livro   # layout e acessibilidade
npm run nada-mockado               # link morto, controle decorativo, dado falso
```

`conferir` mede sobreposição de texto, chip quebrado em duas linhas, valor
partido no meio, transbordo, foco visível, nome de controle e contraste WCAG AA.

`nada-mockado` abre cada tela, segue cada link e reprova destino que responde
erro ou cai em "não encontrado" — mais ícone de ação sem ação e campo fora de
formulário.
