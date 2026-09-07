# Do zero até uma entidade viva

Hoje o Quórum tem uma entidade que funciona — a A.A.A. Engenharia — e ela
**não nasceu pelo produto**. Nasceu de `api/scripts/seed.mjs`, que escreve com
a service role em tabelas cujas políticas não dão INSERT a ninguém.

Este documento é o caminho para que uma pessoa que acabou de criar a conta
chegue no mesmo lugar **pelas telas**, sem script e sem SQL na mão.

O teste que fecha tudo: `eduardocardosi520@gmail.com` cria uma atlética,
cadastra dois colegas, cria o cofre, propõe uma saída, junta duas assinaturas,
executa, e vê o lançamento aparecer no livro-caixa público — sem que ninguém
toque no banco.

---

## Duas pessoas, e o produto só conhece uma

Este documento nasceu errado num ponto, e a correção muda a ordem das fases.

Ele tratava "criar conta" e "criar entidade" como o mesmo movimento. Não são —
e a diferença não é de tela, é de **quem são essas pessoas**:

| | a diretoria | o associado |
| --- | --- | --- |
| quantos | três por entidade | dezenas a centenas |
| o que faz | propõe, assina, executa, cadastra | paga, compra ingresso, confere |
| como entra | funda a entidade, ou é convidada | **pede para entrar** |
| o que vê | o cofre por dentro | saldo, recibos, livro-caixa |

Uma atlética tem **três** signatários e **sessenta e dois** associados. Ou seja:
para cada pessoa que funda uma entidade, vinte pedem para entrar numa que já
existe. O produto hoje só sabe atender a primeira — e a Fase 1, como foi
entregue, colocou justamente a porta mais rara em primeiro lugar.

Foi a única que existia. Não é a que deveria vir primeiro.

**O caminho certo:** a pessoa cria a conta e cai numa tela que pergunta *de qual
entidade você faz parte?* — busca pelo nome, pede para entrar, e a diretoria
aprova. Fundar uma entidade é o link discreto embaixo, para quem realmente vai
fundar.

**O banco já aguenta isso sem migração.** O enum `papel_membro` tem `socio`, e
`membros.ativo` existe e ninguém usa. Uma solicitação pendente é exatamente
`papel = 'socio', ativo = false`: aparece para a diretoria aprovar, e enquanto
não aprovam, as políticas de RLS — que filtram por `ativo` — já não deixam essa
pessoa ver nada. A peça estava pronta e o produto não a usava.

Isso entra como **Fase 1b**, e é ela que deveria ter sido a Fase 1.

---

## Fase 0 · O que existe hoje, medido

Auditado em `6fb9288`, arquivo por arquivo. Não é impressão.

| passo | existe? | onde |
| --- | --- | --- |
| criar a entidade | **sim** | `POST /api/entidade` + `FormularioCriarEntidade` |
| chegar nesse formulário | **não** | só por `/entrar`; a tela de "sem entidade" não oferece |
| cadastrar a diretoria | **não** | `Socios.tsx` é somente leitura |
| criar o cofre | **quase** | só dentro do `PainelCofre`, que exige uma proposta antes |
| propor uma saída | sim | `Propor.tsx` — mas escreve direto no banco |
| assinar e executar | **sim** | pela API, com autorização — provado em produção |
| criar evento e lotes | **não** | só pelo seed |
| ver o livro-caixa | sim | público, sem login |

Três achados que mandam no plano:

**1. A porta não existe.** Quem entra sem entidade cai na tela amarela
"Falta a diretoria te cadastrar" (`Capa.tsx:163`), que oferece ver um
livro-caixa alheio e sair da conta. O texto assume que alguém vai te cadastrar
— e não contempla quem quer **criar a própria entidade**. O formulário existe e
está a um clique de distância que ninguém dá.

**2. O cofre depende de uma proposta.** `criarCofre()` mora dentro do
`PainelCofre` (`src/vivo/PainelCofre.tsx:189`), e o `PainelCofre` só é montado
quando `propostaRetida()` acha uma proposta pendente. Entidade recém-criada não
tem nenhuma. Resultado: **não há caminho de tela para o primeiro cofre.**

**3. As três chaves são globais.** `SIGNER_TESOUREIRA`, `SIGNER_PRESIDENTE` e
`SIGNER_CONSELHO` são variáveis do ambiente do servidor, uma por papel — não
uma por pessoa nem por entidade. Duas atléticas hoje compartilham os mesmos
três signatários. Funciona para demonstrar; não é multi-entidade de verdade, e
o documento não vai fingir que é.

---

## O que dá para fazer antes das 23h59 de hoje

Só a **Fase 1**. Ela é pequena, some com o beco sem saída que você encontrou, e
é exatamente o que um jurado faz: cria conta e tenta usar.

As fases 2 a 6 são trabalho de dias. Estão aqui porque a pergunta era o caminho
inteiro, e porque entregar meia funcionalidade hoje é pior que entregar a de
hoje inteira e dizer o resto com honestidade.

---

## Fase 1 · A porta — **feita** (`main`)

**O problema:** conta nova = beco sem saída.

- [x] Na tela de "sem entidade" (`Capa.tsx`), acrescentar um cartão
      **"Criar uma entidade"** acima de "Falta a diretoria te cadastrar",
      levando a `/entrar?aba=criar`.
- [x] Reordenar o texto: quem chega ali tem dois futuros possíveis — ser
      cadastrado por alguém, ou fundar a própria. Hoje a tela só conhece o
      primeiro, e o primeiro é o menos provável para quem acabou de descobrir o
      produto.
- [x] `Entrar.tsx` passa a ler `?aba=criar` para já abrir na aba certa. Sem
      isso o link entrega a pessoa na aba de login, que é de onde ela veio.
- [x] Depois de criar, redirecionar para `/e/<slug>` em vez de voltar para a
      capa. A entidade existe: mostre-a.

Um quinto item apareceu ao implementar, e sem ele os outros quatro seriam um
botão para o mesmo beco:

- [x] **`POST /api/vinculo`** — casa `membros.user_id` com a sessão, pelo
      e-mail do token validado.

O vínculo já foi `privado.vincular_membro()` e **nunca rodou uma vez**: morava
num schema que o PostgREST não publica, então a chamada do navegador falhava
calada (a própria 0006 descreve isso). A 0006 removeu a função e passou o
vínculo para o servidor, em `lib/dados.ts` — arquivo que depois foi apagado
numa limpeza do `api/`, sem que ninguém notasse, porque quem já estava
vinculado continuou entrando.

Só quem chegava depois ficava eternamente "sem entidade". O banco tinha duas
entidades criadas assim, com `user_id` nulo e o fundador trancado do lado de
fora — foi assim que o problema apareceu.

**Como conferir:** entre com um e-mail que não é de nenhuma entidade. Deve
haver um botão para criar uma. Crie. Você deve cair no cofre da sua entidade
nova, vazio, com o seu nome como tesoureiro.

**Conferido:** as duas telas no Chromium com um Supabase forjado — o cartão
aparece primeiro e aponta para `/entrar?aba=criar`; a tela de criar não expulsa
mais quem já entrou; o e-mail vem fixo da sessão, sem campo para digitar; e
`/api/vinculo` é chamado quando a sessão não acha membro. `npm run conferir` em
`/` e `/entrar` sem violação, e `npm run acesso` passando nos sete crachás.

---

## Fase 1b · Pedir para entrar — **feita** (`main`)

**O problema:** vinte pessoas pedem para entrar numa entidade para cada uma que
funda. A Fase 1 entregou a porta da minoria em primeiro lugar, porque era a
única que existia.

- [x] Na tela de "sem entidade", **"Entrar numa entidade"** passa a ser o cartão
      principal, com busca por nome. "Criar uma entidade" vira link discreto no
      fim — quem funda sabe que veio fundar.
- [x] `GET /api/entidades?busca=` — lista pública de nome, tipo e universidade.
      Nada de saldo: é a lista telefônica, não o cofre.
- [x] `POST /api/solicitacao` — insere `membros` com `papel='socio'` e
      `ativo=false`, ligado ao `user_id` da sessão. **Sem migração:** o enum e a
      coluna já existem.
- [x] Recusar solicitação repetida para a mesma entidade — a chave única
      `(entidade_id, user_id)` da 0001 já garante isso; o endpoint só precisa
      traduzir o erro para uma frase.
- [x] `Socios.tsx` mostra os pendentes para a diretoria, com aprovar e recusar.
      Aprovar é `ativo = true`.
- [x] Enquanto pendente, a capa diz "pedido enviado a X" em vez de "sem
      entidade" — hoje as duas situações são a mesma tela, e não são a mesma
      coisa.

**Por que é seguro:** as políticas de RLS já filtram por `ativo`. Uma
solicitação pendente não enxerga cofre, proposta nem associado — sem que
ninguém escreva uma política nova.

**Um sexto item apareceu:** quem pede não consegue ler o próprio pedido. A
política de `membros` mostra os colegas das entidades DE QUE VOCÊ FAZ PARTE, e
`entidades_do_usuario()` filtra por `ativo` — então um pedido pendente não
enxerga nem a própria linha. É a regra certa, e deixa a tela cega. `POST
/api/vinculo`, que a sessão já chama quando não acha membro, passou a responder
`pendente` junto.

**Como conferir:** de uma conta nova, peça para entrar na A.A.A. Engenharia.
De outra, como diretoria, aprove. A primeira passa a ver o livro-caixa e o
saldo, e continua sem conseguir assinar nada.

**Conferido:** o fluxo inteiro no Chromium com um Supabase forjado — busca
filtra, o pedido sai com o slug certo, a tela vira "Pedido enviado" e o estado
**sobrevive ao recarregamento**, agora vindo do servidor; do lado da diretoria,
o pedido aparece em âmbar com aprovar e recusar, e some ao decidir. `conferir`
em `/` e `/e/aaaeng/socios` sem violação; `acesso` passa nos sete crachás.

---

## Fase 1c · O produto do associado

Hoje o `socio` entra e vê a tela da diretoria com botões que não pode usar. São
sessenta e dois deles por entidade, e nenhuma tela é deles.

- [ ] `/e/:slug` do associado é outra tela: mensalidade em dia ou não, próximo
      evento, ingressos comprados, saldo da entidade, livro-caixa.
- [ ] Sem "Propor saída", sem "Aprovar", sem "Sócios". A barra de abas do
      associado tem menos abas, e isso é a interface dizendo a verdade.
- [ ] Recibo de cada compra, com o comprovante da rede.

**Por que importa para o julgamento:** a tese do produto é transparência para
quem paga. Se quem paga não tem tela, a tese é uma promessa sobre a tela de
outra pessoa.

---

## Fase 2 · O cofre antes da primeira saída

**O problema:** o botão de criar cofre está escondido atrás de uma proposta que
ainda não existe.

- [ ] Mover a criação do cofre para a tela `/e/:slug` (Cofre), como estado
      vazio próprio: "Esta entidade ainda não tem cofre" + botão.
- [ ] `POST /api/cofre` já aceita `entidadeSlug` e já grava em
      `entidades.multisig_pda`/`vault_pda`. **Nenhuma mudança de servidor.**
- [ ] O `PainelCofre` mantém o botão dele para o caso de o cofre sumir no meio
      do caminho, mas deixa de ser o único lugar.

**Como conferir:** entidade nova, sem proposta nenhuma → a tela do cofre
oferece criar. Depois de criar, `/api/estado` responde `motivo: "proposta"` em
vez de `motivo: "cofre"`.

**Cuidado:** criar cofre zera `tx_index` das propostas da entidade
(`gravarCofreDaEntidade`, commit `657f203`). Numa entidade nova não há o que
zerar, mas o botão não pode ficar disponível depois — cofre já criado, botão
some.

---

## Fase 3 · A diretoria

**O problema:** o quórum é 2 de 3 e a entidade nasce com uma pessoa.

- [ ] `POST /api/membro` — cadastra nome, e-mail e papel. Exige `exigirMembro`
      com papel de diretoria: só quem já está dentro convida.
- [ ] Recusar o terceiro signatário quando os três papéis já estiverem
      ocupados. Quatro signatários num cofre 2-de-3 é uma promessa que a rede
      não cumpre.
- [ ] `Socios.tsx` ganha o formulário e a lista com papel editável.
- [ ] `DELETE`/desativar: `membros.ativo` já existe e ninguém usa.

**Como conferir:** cadastre presidente e conselho. A tela de aprovações passa a
mostrar os três nomes no indicador de assinaturas, e `nomesDosAssentos()` para
de cair no rótulo genérico.

**O que NÃO resolve:** cadastrar a Letícia não dá a ela uma chave. Ela assina
com `SIGNER_PRESIDENTE`, que é do servidor. Ver Fase 6.

---

## Fase 4 · A saída nasce no servidor

Esta é a **Fase 2 do `PLANO.md`**, que continua aberta.

- [ ] `POST /api/proposta-nova` cria a linha em `propostas` com validação de
      valor em centavos, rubrica e destino.
- [ ] `Propor.tsx:113` para de escrever direto no Supabase.
- [ ] A política de INSERT em `propostas` some. Hoje ela existe só para o
      navegador conseguir escrever.

**Por que importa:** é o único lugar do fluxo do dinheiro em que o navegador
ainda escreve sozinho. Assinar e executar já passam pela API com autorização.

---

## Fase 5 · A festa

Sem isto, a metade Solana Pay do produto só existe na entidade semeada.

- [ ] `POST /api/evento` — nome, data, local, capacidade, rubrica.
- [ ] `POST /api/lote` — nome, preço em **centavos**, total.
- [ ] Tela de criar evento a partir de `/e/:slug/festas`, que hoje só lista.
- [ ] O slug do evento segue a mesma regra do slug da entidade
      (`slugLivre`, em `api/app/api/entidade/route.ts`).

**Como conferir:** crie um evento com um lote, abra `/f/<slug-do-evento>`,
gere o QR e pague pela carteira de demonstração. A entrada aparece no seu
livro-caixa, não no da A.A.A. Engenharia.

---

## Fase 6 · Uma chave por pessoa

O limite estrutural. Enquanto ele existir, "multi-entidade" é uma meia-verdade.

- [ ] Cada signatário guarda a própria chave — carteira do navegador, e o
      servidor deixa de assinar por ninguém.
- [ ] `POST /api/assinar` passa a receber uma transação já assinada em vez de
      assinar com chave do ambiente.
- [ ] `DEMO_ASSINA_POR_TODOS` some, e o parágrafo que a explica em
      `api/lib/cofre/contexto.ts` some junto.
- [ ] `membros` ganha `pubkey`, e é ela que entra na criação do multisig.

**Consequência boa:** a demonstração deixa de precisar de um aparelho só, e o
produto passa a ser verdadeiro quando alguém perguntar "quem tem a chave?".

**Consequência cara:** exige carteira instalada, e um estudante que só quer ver
o livro-caixa não vai instalar nada. O livro-caixa continua público e sem
carteira — a tese não muda.

---

## Fase 7 · O convite

- [ ] Cadastrar um membro dispara um e-mail com link de entrada.
- [ ] `membros.user_id` casa com a sessão na primeira visita — o mecanismo já
      existe, criado por `/api/entidade` para o primeiro signatário.
- [ ] Enquanto o convite não é aceito, a lista mostra "aguardando".

---

## O que fica de fora, e por quê

**Cobrar pela entidade.** Não há plano pago, e não haverá antes de existir
alguém usando.

**Trocar o slug depois de criado.** O livro-caixa é um link que se manda no
grupo. Link que muda de endereço quebra a promessa do produto.

**Apagar entidade.** Livro-caixa que some não é livro-caixa. No máximo,
arquivar — e arquivada continua legível.

**Rede principal.** `CLAUDE.md`: devnet, nunca mainnet neste repositório.

---

## O caminho completo, quando as sete estiverem de pé

1. Entra com o e-mail → **"Entrar numa entidade"** ou, quem funda,
   **"Criar uma entidade"** *(Fase 1 e 1b)*
2. Escolhe tipo, nome e universidade → cai no cofre vazio *(existe)*
3. Cadastra presidente e conselho *(Fase 3)* → convite por e-mail *(Fase 7)*
4. Cria o cofre 2 de 3 *(Fase 2)*
5. Cria a festa e os lotes *(Fase 5)*
6. Vende um ingresso — o valor cai no cofre *(existe)*
7. Propõe uma saída *(Fase 4)*
8. Duas assinaturas, execução, comprovante *(existe, provado)*
9. Tudo aparece no livro-caixa público, sem login *(existe)*

Cinco dos nove passos já funcionam. É por isso que este documento tem sete
fases e não um recomeço.
