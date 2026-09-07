# Plano para terminar o Quórum

Sem mock no frontend, com o backend no centro.

Escrito a partir de uma auditoria do código em `2e8985a`, não de suposição.
Cada fase diz o que muda, por que, e como se confere que ficou pronto.

---

## O estado hoje, medido

O que funciona de verdade:

| parte | situação |
| --- | --- |
| Leitura das telas | real, do Supabase, com RLS ligada |
| Livro-caixa e página da festa | públicos, sem login, com dado real |
| Compra de ingresso | ponta a ponta: reserva → pagamento devnet → conciliação → lançamento |
| Criar entidade | real, via `POST /api/entidade` |
| Magic link | real |
| Bloqueio por falta de quórum | real, on-chain, código 6008 |

**E aqui está o buraco.** Três achados da auditoria, em ordem de gravidade:

**1. Assinar e executar não tocam o banco.**
`/api/assinar` e `/api/executar` agem só na rede. Nenhuma linha entra em
`assinaturas`, `propostas.status` nunca vira `executada`, e **nenhum lançamento
é criado quando uma saída executa**. Ou seja: a saída acontece na devnet e o
livro-caixa não fica sabendo. A tabela `assinaturas` só tem o que a semente
plantou.

**2. O cofre não é da entidade — é de um arquivo.**
`entidades.multisig_pda` é lida em cinco lugares e **nunca escrita**. O
multisig real vive em `backend/.cofre-devnet.json`, um por servidor. Os
endpoints `/api/estado`, `/api/assinar`, `/api/executar` e `/api/proposta` não
recebem identificador nenhum: operam sempre sobre esse cofre único. Com duas
entidades no banco, as duas apontam para o mesmo dinheiro.

**3. A API é aberta.**
Nenhum endpoint verifica quem está chamando. O CORS limita a origem do
**navegador**, e está escrito no próprio `lib/cors.ts` que um `curl` ignora
tudo. Hoje qualquer pessoa com a URL executa uma saída.

Mais dois, menores:

**4. `Propor.tsx` escreve direto no banco** pelo navegador — a única escrita do
front. A proposta nasce sem `tx_index`, ou seja, sem existir na rede.

**5. Festas e Sócios são listas sem ação.** Não há criar festa, criar lote,
convidar signatário nem trocar diretoria.

---

## O caminho do dinheiro, e por que ele decide o escopo

Esta seção existe porque a pergunta aparece na primeira rodada de avaliação, e
porque a resposta certa **encolhe** o trabalho em vez de aumentá-lo.

### Pix precisa de autorização — mas não a nossa

O Pix é operado pelo Banco Central, e só participa dele instituição autorizada:
banco ou instituição de pagamento. Um app de atlética nunca vai ser
participante, e não precisa ser. O caminho é integrar um PSP já autorizado e
emitir a cobrança **em nome da entidade**, numa conta que é dela.

A linha que decide tudo:

| o dinheiro… | o que o Quórum é |
| --- | --- |
| vai do aluno **direto** para a conta da entidade, no PSP dela | **software.** Não guarda, não repassa, não custodia |
| passa por uma conta **nossa** e depois é repassado | **arranjo de pagamento** — custódia de recurso de terceiro, e a regulação passa a valer para nós |

O produto tem que ficar na primeira linha, e é natural que fique: ele não quer
ser a tesouraria de ninguém. Quer ser a **regra de quem pode tirar** e o
**livro aberto** de tudo que entrou e saiu. Isso é software.

> Isto é desenho técnico, não parecer jurídico. Antes de qualquer piloto com
> dinheiro real, confirme com quem seja advogado.

### O contrato inteligente já existe

Vale dizer alto, porque é o ponto menos óbvio do próprio projeto: **o cofre não
é simulado.** O `backend/package.json` depende de `@sqds/multisig`, e o código
chama o **Squads v4**, um programa publicado na rede. Criar cofre, propor
saída, aprovar e executar são instruções dele. Quando falta a segunda
assinatura, quem recusa é o contrato — o `6008` que a tela mostra vem de lá,
não de um `if` nosso.

Reescrever isso à mão seria trocar código auditado, com dinheiro real rodando
nele, por código nosso guardando dinheiro de estudante. Seria pior, não melhor.

### O que contrato nenhum resolve

Nenhum contrato transforma **R$ 60 na conta de um aluno** em algo que ele possa
guardar. Essa travessia precisa de instituição regulada, e ela acontece **duas
vezes**:

```
aluno paga R$ 60 → [travessia] → cofre 2-de-3 → [travessia] → fornecedor recebe
      Pix           PSP / VASP     contrato        PSP / VASP     na conta dele
```

Guardar o caixa em stablecoin deixaria o miolo mais honesto — o dinheiro de
verdade sob a regra do quórum. Mas as duas pontas continuariam precisando de
instituição autorizada (no Brasil, prestadora de serviço de ativos virtuais,
regulada pelo Banco Central desde a Lei 14.478/2022). E tem o detalhe que mata
a ideia para uma atlética: **o fornecedor quer real na conta dele.** A segunda
travessia é obrigatória.

**Consequência para este plano:** a integração com PSP não entra em nenhuma
fase. Ela é trabalho de contrato comercial e conta bancária, não de código — e
o código que a receberia é o mesmo `lib/pagamento.ts` de hoje, com outra
implementação de `montarCobranca` e `procurarPagamento`. Fica registrado como
premissa, não como tarefa.

---

## A conta do tempo

A entrega é **hoje, 7 set 2026, 23h59**. As fases 1 a 3 são a espinha e não
cabem todas até lá. Então o plano é lido em duas alturas:

- **Faixa A — até a entrega.** Fases 0, 1 e 2. É o mínimo para a demonstração
  ser verdadeira do começo ao fim e o app não ser derrubado por um `curl`.
- **Faixa B — depois.** Fases 3 a 8. É o que transforma a demonstração em
  produto.

Se o tempo apertar, corte da Faixa B, nunca da Faixa A. E dentro da Faixa A,
a ordem importa: a Fase 1 destrava a 2.

---

# Faixa A — até a entrega

## Fase 0 · Configuração de ambiente

**Bloqueia todas as outras.** É só painel, não tem código.

Quatro dos cinco já foram feitos.

- [x] **Vercel → `ORIGENS_PERMITIDAS`** = `https://solana-hacka-university.lovable.app`
      (Production e Preview). Sem ela a lista de origens fica vazia em produção
      e o navegador recusa toda chamada do Lovable para a API. Redeploy depois
      — a variável só entra num build novo.
- [x] **Vercel → `SITE_URL` renomeada para `NEXT_PUBLIC_SITE_URL`**, ou apagada.
      Do jeito que estava, nenhum código a lia.
- [x] **Supabase → Redirect URLs** com
      `https://solana-hacka-university.lovable.app/auth/confirmar`.
- [x] **Supabase → `service_role` resetada**, e atualizada na Vercel. A chave
      antiga tinha sido colada em chat e ido num zip; a partir daqui ela não
      abre mais nada.
- [ ] **Google**: ligar o provedor em Authentication → Providers, **ou** remover
      o botão. Hoje ele faz chamada real e responde uma mensagem honesta de que
      o provedor está desligado — aceitável, mas não bonito na apresentação.

**Como conferir:** abrir o Lovable, F12 → Console, entrar na tela de
aprovações. Nenhum erro com as palavras *CORS policy*.

---

## Fase 1 · O backend vira dono do cofre

O coração do plano. Resolve os achados 1, 2 e 3 juntos, porque eles são o mesmo
problema visto de três ângulos.

### 1.1 · Autenticação na API — **feita**

- `src/lib/api.ts` manda `Authorization: Bearer <access_token>` em toda chamada,
  lido de `supabase.auth.getSession()`. Sem sessão, sai sem cabeçalho: token
  vazio faria o servidor responder "sessão expirou" a quem nunca entrou.
- `backend/lib/autorizacao.ts` valida o token com a **chave anônima** (validar
  assinatura de JWT não precisa de poder nenhum) e consulta `membros` com a
  service role — aqui se está *decidindo* o acesso, e sob RLS "não é membro"
  ficaria indistinguível de "entidade não existe".
- Aplicada em `/api/proposta`, `/api/assinar`, `/api/executar` e `/api/cofre`.
  `/api/estado` ficou aberta de propósito, com o motivo escrito no arquivo:
  tudo que ela devolve está na devnet, legível por qualquer um.
- As três chamadas do cofre passaram a mandar `entidadeSlug`. Sem ele o servidor
  cai na única entidade da pessoa, e recusa com 400 se houver mais de uma —
  adivinhar em qual cofre mexer é o erro que ninguém percebe até o dinheiro sair
  do lugar errado.

**Como conferir:** `npm run acesso`, em `backend/`. Ele é inofensivo: apaga as
três chaves do cofre do ambiente do filho, então nenhum caso chega à devnet.
Sem isso o caso que deve passar ia até o fim e criava um multisig de verdade a
cada execução — um conferidor de fechadura não abre a porta para ver se abriu. Ele sobe um GoTrue de
mentira e a API contra ele, roda os sete casos nos quatro endpoints e sai com
código 1 se algum falhar. O Supabase de mentira não é preciosismo: sem ele todo
token é recusado porque a validação não alcança o Supabase real, e o caso
"token inválido → 401" passaria pelo motivo errado, sem nunca provar que um
token BOM é aceito. Fechadura que trava com qualquer chave não foi testada —
foi observada emperrada.

Contra o que está no ar: `npm run acesso -- https://…vercel.app`. Cobre os três
casos que não precisam de usuário conhecido, e diz quais ficaram de fora.

| quem chama | resposta |
| --- | --- |
| sem cabeçalho | **401** · "Entre para continuar." |
| esquema errado (`Basic`) | **401** |
| token inválido | **401** · "Sua sessão expirou." |
| sócio | **403** · "Só a diretoria pode fazer isso." |
| sem entidade | **403** · "Você não faz parte desta entidade." |
| slug de outra entidade | **403** |
| signatária, slug certo | **passa** — chega na lógica do cofre |

O conferidor pagou por si na primeira execução: `/api/proposta` e `/api/cofre`
liam a autorização **sem olhar o corpo**, então ignoravam o `entidadeSlug` e
caíam na entidade única de quem chamava. Quem pedisse o cofre da entidade B
teria o da A mexido, calado. Corrigido.

> O CORS continua, mas deixou de ser a única defesa. Ele protege o navegador de
> terceiros; a autorização protege o endpoint.

**O que 1.1 deliberadamente NÃO resolve:** o assento (`tesoureira`, `presidente`,
`conselho`) ainda vem no corpo, não da conta de quem chama. As três chaves
privadas moram no ambiente do servidor, então hoje elas não pertencem a
ninguém — amarrar assento à conta só faz sentido quando cada signatário
guardar a própria chave, e isso é outra fase. Até lá, um signatário pode assinar
usando o assento de outro. Está trancado contra estranhos, não contra a própria
diretoria.

### 1.2 · Um cofre por entidade

- Migração `0009`: `propostas.tx_index` já existe; adicionar
  `entidades.vault_pda text unique` para não recalcular a derivação a cada
  chamada.
- `POST /api/cofre` passa a receber `{ entidadeSlug }`, cria o multisig 2-de-3
  com os três signatários daquela entidade e **grava `multisig_pda` e
  `vault_pda` na linha da entidade**.
- A `createKey` é usada uma vez e **descartada**: ela não é signatária, não
  move dinheiro, e guardá-la só cria mais um segredo para vazar. (Já vazou uma
  vez, no commit `ba90b8b`.)
- `backend/.cofre-devnet.json` deixa de ser fonte de verdade. Vira só a saída
  dos scripts de linha de comando.

### 1.3 · A proposta existe na rede e no banco

Os quatro endpoints passam a receber `propostaId` e a derivar a entidade dele.

| endpoint | o que passa a fazer, além do que já faz |
| --- | --- |
| `POST /api/proposta` | cria a `vault_transaction` + `proposal` na rede e grava `tx_index` na linha |
| `POST /api/assinar` | grava linha em `assinaturas` (`proposta_id`, `membro_id`, `tx_signature`) |
| `POST /api/executar` | grava o **lançamento de saída** e vira `propostas.status` para `executada` |
| `GET /api/estado` | conta assinaturas do banco e confere com a rede; divergência é log, não erro de tela |

**A ordem de escrita importa**, e é a mesma lição da conciliação de ingresso
(`lib/ingresso.ts`): primeiro vira o status condicionado ao valor anterior,
depois grava o lançamento. Quem perder a corrida não duplica o lançamento.

**Falta de quórum continua 200 com `bloqueado: true`.** Não é erro, é a regra
funcionando, e é a coisa que o produto inteiro existe para mostrar. Um `catch`
genérico ali destrói a demonstração.

**Como conferir:**
- `curl` sem token em `/api/executar` → **401**, não 200.
- Executar uma saída pela tela e o valor aparecer no **livro-caixa público**
  em segundos, sem recarregar nada à mão.
- `select count(*) from assinaturas` cresce a cada assinatura na tela.

---

## Fase 2 · A última escrita sai do navegador

Resolve o achado 4.

- `src/telas/Propor.tsx` deixa de fazer `supabase.from('propostas').insert(...)`
  e passa a chamar `POST /api/proposta`.
- RLS: revogar `insert` em `propostas` para `authenticated`. Enquanto o
  navegador puder inserir, o caminho do servidor é opcional — e caminho
  opcional é caminho que alguém pula.
- Conferir que o valor continua em **centavos inteiros** na conversão. O
  `paraCentavos` do backend é baseado em string de propósito: `19.99 * 100` dá
  `1998.9999999999998`.

**Como conferir:** `scripts/nada-mockado.mjs` continua passando, e uma proposta
criada pela tela nasce **com `tx_index` preenchido** — hoje nasce sem.

---

# Faixa B — depois da entrega

## Fase 3 · Gestão da entidade

O que hoje é lista sem ação.

- **Convidar signatário e sócio**: `POST /api/membro`, com papel. Um signatário
  novo muda o multisig na rede; um sócio, não. São dois caminhos diferentes e o
  segundo é o fácil — comece por ele.
- **Criar festa e lote**: `POST /api/evento`, `POST /api/lote`. A página pública
  da festa já sabe ler; falta quem escreva.
- **Trocar diretoria** (prancha `6f`): a operação mais delicada do produto,
  porque mexe nos signatários do cofre com dinheiro dentro. Exige as duas
  assinaturas antigas para valer.

## Fase 4 · Os estados desenhados que faltam

As pranchas `6a`–`6f` são estados, não rotas. Conferir uma a uma contra dado
real: cofre vazio, proposta recusada, saída executada, executando, erro de
rede, troca de diretoria. Cada uma precisa de um caminho que a produza de
verdade — estado que só aparece com `?estado=` é estado que ninguém vê.

## Fase 5 · A regra que o Squads não sabe

Só aqui um programa próprio se justifica — e só depois de auditado. Antes disso,
o Squads faz melhor do que faríamos.

O que ele não sabe, e um programa em Anchor por cima do vault saberia:

- **Limite por rubrica.** "Marketing não passa de R$ 2.000 no mês, mesmo com
  quórum." O contrato não conhece o conceito de rubrica; hoje isso só existe no
  banco, e o banco não segura ninguém.
- **Trava de tempo.** Saída acima de um valor só executa 24h depois de aprovada,
  dando janela para o conselho barrar antes de o dinheiro sair.
- **Mandato com validade.** A diretoria de 2026 perde a assinatura em 31/12
  sozinha, sem depender de alguém lembrar de trocar — que é exatamente o
  momento em que atlética perde dinheiro.

Isso é trabalho de semanas mais auditoria. **A auditoria não é opcional**: é o
que separa "escrevemos um contrato" de "confie seu dinheiro a ele". Enquanto
ela não existir, este item não sai do papel — colocar dinheiro de estudante sob
código nosso não auditado seria pior que o problema que o produto resolve.

## Fase 6 · Endurecimento

- **Limite de chamadas** em `/api/entidade` e nos endpoints de ingresso. Hoje o
  `/api/entidade` tem só uma espera de cinco minutos por e-mail, o suficiente
  para o toque duplo e nada além disso.
- **Confirmação de e-mail antes de criar a entidade.** Hoje ela nasce na hora,
  e está comentado no código que isso é escolha da demonstração.
- **Advisors do Supabase** no verde (hoje só sobra o aviso de senha vazada, que
  não se aplica — o produto não tem senha).
- **Revisão de RLS tabela por tabela**, agora que a API é a dona das escritas.

## Fase 7 · Testes que não dependem de mim rodando à mão

- `conferir.mjs` e `nada-mockado.mjs` já existem e reprovam com código 1.
  Falta rodá-los no CI, em cada push.
- Um teste de ponta a ponta do caminho do dinheiro: propor → assinar → assinar
  → executar → conferir o lançamento no livro público.

## Fase 8 · Fora do código, mas parte de terminar

- Páginas de **Termos** e **Política de Privacidade**. Hoje a frase na tela de
  entrada é texto e não link, de propósito, porque link para o vazio é pior que
  frase solta. Com as páginas, viram links.
- **Um repositório, um deploy.** A Vercel já aponta para o monorepo com
  *Root Directory* = `backend`. O repositório antigo
  (`Solana-Hacka-University`) pode ser arquivado.

---

## O que fica de fora, e por quê

**Mainnet.** `conexao()` recusa qualquer `SOLANA_RPC_URL` com "mainnet" no
nome, e isso não é para ser afrouxado. Dinheiro real exige custódia, contrato
auditado e responsabilidade jurídica que um hackathon não tem.

**Ser participante do Pix.** Não é escopo e não deveria ser: exigiria
autorização do Banco Central, e o produto não quer custodiar dinheiro de
ninguém. A cobrança sai por PSP autorizado, direto na conta da entidade — ver
"O caminho do dinheiro". Enquanto isso, o demo roda em devnet, e a interface
**nunca diz "Pix" nos componentes de execução**: dizer que já é seria mentir
para quem avalia.

**Programa próprio guardando dinheiro real.** A Fase 5 desenha um, e ele fica
onde está até passar por auditoria. Contrato escrito num hackathon segurando o
caixa de uma atlética é um risco maior que o tesoureiro que o produto veio
substituir.

**A capa deixar de ser imagem.** O `2 de 3` e o `R$ 8.400,00` da capa vêm da
arte, não do banco. É custo aceito e documentado: se o quórum mudar, a capa
mente até alguém reexportar. Só vale desfazer se o quórum virar configurável.

---

## Regras que nenhuma fase quebra

Estão em [`CLAUDE.md`](../CLAUDE.md). As que mais custam quando se esquece:

- Dinheiro é **integer em centavos**. Nunca float, nem em variável intermediária.
- **Falta de quórum não é erro.** 200 com `bloqueado: true`.
- Bibliotecas de Solana e chaves privadas **só no servidor**, com
  `export const runtime = 'nodejs'`.
- **Nada sensível em `NEXT_PUBLIC_*` nem em `VITE_*`.** A `service_role` nunca
  sai do ambiente da API.
- **RLS ligada em toda tabela**, sem exceção.
- Nenhuma palavra de blockchain na interface. O vocabulário é: cofre,
  assinatura, saída, entrada, livro-caixa, rubrica, proposta, quórum,
  comprovante, retido.
