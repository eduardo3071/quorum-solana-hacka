# API do Quórum

Contrato dos endpoints para uma interface hospedada em outro domínio.

**Base:** `https://solana-hacka-university.vercel.app`

Toda resposta é JSON. Todo valor em dinheiro é **integer em centavos** —
`8000` são R$ 80,00. Nunca float, em lugar nenhum.

## Por que existe uma API separada

As bibliotecas da rede e as chaves privadas dos signatários vivem **só no
servidor**. Nenhuma delas pode ir para o navegador, em hipótese nenhuma — uma
chave privada no bundle do front é a chave publicada. Por isso estes endpoints
existem: o front pede, o servidor assina.

Leitura de dado é diferente: o front fala **direto com o Supabase**, com a
chave anônima, e o RLS decide o que ele enxerga. Ver a seção no fim.

## CORS

O navegador só deixa outra origem chamar estes endpoints se ela estiver na
variável `ORIGENS_PERMITIDAS` do servidor, separada por vírgula. Aceita origem
exata e curinga de subdomínio:

```
ORIGENS_PERMITIDAS=https://*.lovable.app,https://*.lovableproject.com,https://meu-dominio.com
```

Em desenvolvimento, `localhost:3000`, `:5173` e `:8080` já entram sozinhos.

Origem fora da lista recebe a resposta sem o cabeçalho de liberação, e o
navegador bloqueia. **CORS protege o navegador de terceiros, não o endpoint**:
um `curl` ignora tudo isto. Estes endpoints mexem só em devnet.

---

## O cofre

Os três signatários são posições da chave no servidor, não pessoas do banco:
`tesoureira`, `presidente`, `conselho`. O nome de quem ocupa cada uma vem da
tabela `membros`.

### `GET /api/estado`

A situação do cofre e da proposta pendente. É o que a tela pede ao abrir.

Sem cofre criado — **200**, e não é erro:

```json
{ "existe": false }
```

Com cofre:

```json
{
  "existe": true,
  "multisigPda": "5Kd…",
  "vaultPda": "9Wz…",
  "transactionIndex": "1",
  "status": "Active",
  "assinaturasFeitas": 1,
  "assinaturasNecessarias": 2,
  "assinaram": ["tesoureira"],
  "saldoCaixa": 0.2,
  "saldoDestino": 0
}
```

`saldoCaixa` e `saldoDestino` são SOL da devnet, não reais. Não some com
centavos.

### `POST /api/cofre`

Cria o cofre 2-de-3, abastece o caixa e já deixa uma proposta pendente. Leva de
10 a 40 segundos. Sem corpo.

```json
{ "criado": true, "multisigPda": "…", "vaultPda": "…", "transactionIndex": "1", "assinatura": "…" }
```

### `POST /api/proposta`

Nova proposta de saída no cofre existente, sem refazer o cofre. Sem corpo.

```json
{ "criada": true, "transactionIndex": "2", "destino": "…", "assinatura": "…" }
```

### `POST /api/assinar`

```json
{ "papel": "presidente" }
```

Devolve a assinatura e **a situação já atualizada**, para o indicador não
mostrar número velho enquanto uma segunda chamada não volta:

```json
{ "assinado": true, "assinatura": "…", "explorador": "https://explorer.solana.com/tx/…?cluster=devnet", "existe": true, "assinaturasFeitas": 2, "…": "…" }
```

### `POST /api/executar` — o endpoint mais importante

```json
{ "papel": "tesoureira" }
```

Deu certo:

```json
{
  "executado": true,
  "assinatura": "…",
  "explorador": "https://explorer.solana.com/tx/…?cluster=devnet",
  "saldoCaixa": 0.15,
  "saldoDestino": 0.05
}
```

**Faltou quórum — responde 200, nunca 500:**

```json
{
  "bloqueado": true,
  "assinaturasFeitas": 1,
  "assinaturasNecessarias": 2,
  "status": "Active",
  "saldoCaixa": 0.2,
  "explorador": "https://explorer.solana.com/tx/…?cluster=devnet"
}
```

> **Isto não é erro e não pode virar tela de erro.** É a regra do cofre
> funcionando, e é a coisa que o produto inteiro existe para mostrar. A
> interface tem que renderizar o bloco de bloqueio desenhado, com a contagem de
> assinaturas e a frase de que nenhum valor saiu. Um `catch` genérico aqui
> destrói a demonstração.
>
> Erro de verdade — rede, RPC fora do ar — vem como **503** com
> `{ "erro": "…" }`. São coisas diferentes e telas diferentes.

## A festa

### `POST /api/ingresso`

Reserva um ingresso e devolve a cobrança. Abre sem login.

```json
{ "loteId": "uuid-do-lote" }
```

```json
{
  "referencia": "7Yk3Qw…",
  "lote": "2º lote · sócio",
  "valorCentavos": 8000,
  "destino": "9Wz…",
  "qr": "<svg …>",
  "url": "solana:9Wz…?amount=0.000800000&reference=7Yk3Qw…"
}
```

`qr` vem **desenhado do servidor**, como texto SVG. Insira direto no DOM; não
carregue biblioteca de QR no front. O preço vem do lote no banco, nunca do
corpo do pedido — preço que o cliente manda é preço que o cliente escolhe.

Lote esgotado — **409**, `{ "erro": "…", "esgotado": true }`. O pedido estava
certo, o mundo é que mudou: mostre "esgotado" no lote, não tela de erro.

### `POST /api/conciliar`

Procura o pagamento e, se achou, grava a entrada no livro-caixa. Chame em laço
a cada 2 ou 3 segundos enquanto espera.

```json
{ "referencia": "7Yk3Qw…" }
```

Ainda não pagaram — **200**, estado normal da espera:

```json
{ "pago": false }
```

Pagou:

```json
{
  "pago": true,
  "valorCentavos": 8000,
  "lote": "2º lote · sócio",
  "evento": "Baile de Aniversário 32 anos",
  "comprovante": "https://explorer.solana.com/tx/…?cluster=devnet",
  "livro": "/e/aaaeng/livro"
}
```

**Idempotente.** Chamar dez vezes grava um lançamento só — quem garante é o
banco, não o front. Pode consultar à vontade.

### `POST /api/pagar-demo`

Paga a cobrança a partir da carteira de demonstração, para a gravação não
depender de um app de pagamento configurado no celular de alguém. Monta a mesma
transferência que o QR pediria.

```json
{ "referencia": "7Yk3Qw…" }
```

```json
{ "pagou": true, "assinatura": "…" }
```

Só devnet: se o RPC apontar para mainnet, o servidor recusa antes de qualquer
coisa acontecer.

---

## Erros

| status | quando | corpo |
| --- | --- | --- |
| 400 | pedido malformado, ou variável de ambiente faltando no servidor | `{ "erro": "…" }` |
| 404 | referência de compra inexistente | `{ "erro": "…" }` |
| 409 | lote esgotado | `{ "erro": "…", "esgotado": true }` |
| 503 | rede, RPC, banco fora do ar | `{ "erro": "…" }` |

A mensagem em `erro` já vem escrita para aparecer na tela: em português, sem
`AnchorError` nem `PublicKey`. A causa técnica fica no log do servidor.

**Falta de quórum nunca é erro.** Ver `/api/executar`.

---

## Ler dados: direto do Supabase

O front usa `@supabase/supabase-js` com a URL do projeto e a **chave anônima**.
Ela é pública por natureza — quem protege os dados é o RLS, não o segredo da
chave. A `service_role` **nunca** vai para o front.

O que a política deixa passar:

| tabela | anônimo | autenticado |
| --- | --- | --- |
| `entidades` | só `publico = true` | as próprias, também |
| `eventos` | tudo | tudo |
| `lotes` | tudo | tudo |
| `lancamentos` | de entidade pública | da própria entidade |
| `membros` | **nada** | colegas da própria entidade |
| `propostas` | **nada** | da própria entidade |
| `assinaturas` | **nada** | da própria entidade |
| `ingressos` | **nada** | os próprios; diretoria vê os da entidade |

`membros` não abre para anônimo porque guarda `pubkey` ao lado de nome — chave
não fica junto de dado pessoal.

**Escrita de dinheiro não tem política para ninguém.** Lançamento e mudança de
status nascem no servidor, depois que a rede confirmou. O front não escreve em
`lancamentos`, `ingressos` nem no status de `propostas` — só os endpoints
acima, com a `service_role`.

O front pode inserir `propostas` e `assinaturas` em nome próprio: a política
exige que `criado_por` / `membro_id` seja o registro do próprio usuário, e que
o papel não seja `socio`. Sócio não assina.

### Entrar

Link por e-mail, sem senha:

```js
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/auth/confirmar` },
});
```

O domínio do front precisa estar em **Authentication → URL Configuration →
Redirect URLs** no painel do Supabase, senão o link volta para o lugar errado.

Quem entra por um e-mail que a diretoria não cadastrou fica **sem entidade** —
não é erro, é convite pendente, e merece uma tela própria.

## Campos que a interface precisa acertar

- **Dinheiro é centavos.** `valor_centavos: 4318025` é `R$ 43.180,25`. Formate
  com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Saída usa `−` (U+2212)**, o menos matemático, não o hífen. Entrada usa `+`.
- **`tabular-nums`** em todo número, senão a coluna dança.
- **Rubrica** é categoria contábil — `Eventos`, `Marketing`, `Esporte`,
  `Associados` —, nunca sinônimo de assinatura.
- **Nenhuma palavra de blockchain na interface**, e **nenhuma menção a Pix nos
  componentes de execução**. Ver o briefing em `docs/BRIEF-lovable.md`.
