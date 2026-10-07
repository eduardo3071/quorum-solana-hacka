/**
 * Português → inglês, texto por texto.
 *
 * As telas continuam escritas em pt-BR (é a língua do produto). Quando a
 * pessoa escolhe EN, `idioma.tsx` troca cada texto visível pelo equivalente
 * daqui. O que não está no dicionário segue em português — melhor que inventar.
 */
export const FRASES: Record<string, string> = {
  // ── Geral / navegação
  'Quórum': 'Quórum',
  'Tesouraria estudantil': 'Student treasury',
'Quórum — tesouraria estudantil': 'Quórum — student treasury',
  'Hackathon Universitário · Superteam Brasil': 'University Hackathon · Superteam Brazil',
  'Navegação principal': 'Main navigation',
  'Voltar': 'Back',
  'Voltar ao início': 'Back to start',
  'Voltar para entrar': 'Back to sign in',
  'Tentar de novo': 'Try again',
  'Cancelar': 'Cancel',
  'Buscar': 'Search',
  'Sair': 'Sign out',
  'Sair desta conta': 'Sign out of this account',
  'Ver ›': 'View ›',
  'Ver todas ›': 'See all ›',
  'Criar ›': 'Create ›',
  'ou': 'or',
  'e': 'and',
  'de': 'of',
  'Página não encontrada': 'Page not found',
  'O endereço que você abriu não existe. Confira o link que você recebeu.':
    'The address you opened does not exist. Check the link you received.',
  'ao vivo': 'live',
  'aberto': 'open',
  'encerrada': 'closed',
  'a definir': 'to be defined',
  'disponível': 'available',
  'decorridos': 'elapsed',
  'chamar': 'call',
  'comprovante': 'receipt',
  'Demonstração em rede de teste — nenhum valor real é movimentado.':
    'Demo on a test network — no real money is moved.',
  'Quórum v0.1': 'Quórum v0.1',

  // ── Abas / telas
  'Cofre': 'Vault',
  'Aprovar': 'Approve',
  'Aprovações': 'Approvals',
  'Livro': 'Ledger',
  'Livro-caixa': 'Ledger',
  'Livro-caixa público': 'Public ledger',
  'livro-caixa público': 'public ledger',
  'Perfil': 'Profile',
  'Sócios': 'Members',
  'Sócios ativos': 'Active members',
  'Festas': 'Parties',
  'Receber': 'Receive',
  'Propor': 'Propose',
  'Propor saída': 'Propose payout',
  'Propor uma saída': 'Propose a payout',
  'Ver as festas': 'See parties',
  'Ver festas': 'See parties',
  'Ver o livro-caixa': 'See the ledger',
  'Abrir o livro-caixa': 'Open the ledger',
  'Ver um livro-caixa aberto': 'See an open ledger',
  'Abrir sócios ativos': 'Open active members',

  // ── Capa / entrar
  'O caixa da atlética na sua mão. Mais transparência, mais confiança, mais conquistas.':
    'The athletics treasury in your hands. More transparency, more trust, more achievements.',
  'Mais transparência para uma atlética mais forte.':
    'More transparency for a stronger athletics club.',
  'Duas assinaturas de três: com o quórum atingido, a saída é aprovada. Livro-caixa aberto. Tudo registrado.':
    'Two of three signatures: once quorum is reached, the payout is approved. Open ledger. Everything recorded.',
  'Cofre com quórum': 'Quorum vault',
  'Entrar': 'Sign in',
  'Entrar →': 'Sign in →',
  'Entrar agora': 'Sign in now',
  'Entrou como': 'Signed in as',
  'Primeiro acesso': 'First access',
  'Já tenho senha': 'I have a password',
  'Esqueci a senha': 'Forgot password',
  'Seu e-mail': 'Your email',
'E-mail institucional': 'Institutional email',
  'voce@grad.ufsc.br': 'you@grad.ufsc.br',
  'Senha': 'Password',
  'Nova senha': 'New password',
  'Mostrar a senha': 'Show password',
  'Esconder a senha': 'Hide password',
  'Pelo menos 8 caracteres.': 'At least 8 characters.',
  'A senha precisa ter pelo menos 8 caracteres.': 'The password needs at least 8 characters.',
  'Continuar com Google': 'Continue with Google',
  'Abrindo o Google…': 'Opening Google…',
  'Abrindo o link…': 'Opening the link…',
  'Enviar link →': 'Send link →',
  'Criar minha senha →': 'Create my password →',
  'Salvar senha →': 'Save password →',
  'Senha trocada.': 'Password changed.',
  'Confirme seu e-mail': 'Confirm your email',
  'Escolha a senha que você vai usar para entrar.': 'Choose the password you will use to sign in.',
  'Entre com seu e-mail e sua senha para continuar.': 'Sign in with your email and password to continue.',
  'Ao entrar você aceita os Termos e a Política de Privacidade.':
    'By signing in you accept the Terms and the Privacy Policy.',
  'Confira o e-mail — parece incompleto.': 'Check the email — it looks incomplete.',
  'E-mail ou senha não conferem.': 'Email or password do not match.',
  'Esse e-mail já tem senha. Use "Entrar" ou peça uma nova senha.':
    'This email already has a password. Use "Sign in" or request a new one.',
  'A entrada pelo Google ainda não está ligada. Use o link por e-mail.':
    'Google sign-in is not enabled yet. Use the email link.',
  'Não conseguimos falar com o Google agora. Use o link por e-mail.':
    "We couldn't reach Google right now. Use the email link.",
  'Não conseguimos criar a senha agora. Tente de novo.': "We couldn't create the password now. Try again.",
  'Não conseguimos salvar a senha. Peça outro link e tente de novo.':
    "We couldn't save the password. Request another link and try again.",
  'O link veio incompleto. Entre com e-mail e senha.': 'The link was incomplete. Sign in with email and password.',
  'Sua sessão venceu. Entre de novo com e-mail e senha.': 'Your session expired. Sign in again with email and password.',
  'entre na sua conta primeiro': 'sign in first',
  'Entre na sua conta antes de criar uma entidade.': 'Sign in before creating an organization.',
  'O celular está sem internet': 'The phone is offline',

  // ── Entidades
  'De qual entidade você faz parte?': 'Which organization are you part of?',
  'Buscar entidade pelo nome': 'Search organization by name',
  'Nome da atlética ou faculdade': 'Athletics club or college name',
  'Nenhuma entidade com esse nome. Confira a grafia — ou funde a sua, no fim da página.':
    'No organization with that name. Check the spelling — or found yours at the bottom of the page.',
  'Ou crie uma entidade nova': 'Or create a new organization',
  'Criar uma entidade': 'Create an organization',
  'Criar entidade →': 'Create organization →',
  'Nome da entidade': 'Organization name',
  'Diga o nome da entidade.': 'Enter the organization name.',
  'Tipo': 'Type',
  'Atlética': 'Athletics club',
  'Comissão de formatura': 'Graduation committee',
  'Empresa júnior': 'Junior enterprise',
  'Centro acadêmico': 'Student council',
  'Você entra como o primeiro dos três signatários': 'You join as the first of three signers',
  'Você será o primeiro dos três signatários. Os outros dois entram por convite.':
    'You will be the first of three signers. The other two join by invitation.',
  'Não conseguimos criar a entidade agora. Tente de novo.': "We couldn't create the organization now. Try again.",
  'Você ainda não está em nenhuma entidade': "You're not in any organization yet",
  'Pedido enviado': 'Request sent',
  'Assim que aprovarem, o saldo e os seus recibos aparecem aqui. Você não precisa pedir de novo.':
    "As soon as they approve, the balance and your receipts show up here. You don't need to ask again.",
  'Não conseguimos enviar seu pedido agora.': "We couldn't send your request now.",
  'para entrar': 'to join',
  ', mas esse e-mail não consta na diretoria de nenhuma atlética. Peça para quem administra cadastrar você.':
    ", but this email isn't on any club's board. Ask an admin to register you.",

  // ── Cofre
  'Saldo': 'Balance',
  'Retido': 'Held',
  'Entrou': 'In',
  'Saiu': 'Out',
  'Movimentações': 'Transactions',
  'Nenhuma movimentação ainda. A primeira venda de ingresso ou saída aprovada aparece aqui — e no livro-caixa, aberto a qualquer associado.':
    'No transactions yet. The first ticket sale or approved payout shows up here — and in the ledger, open to any member.',
  'O saldo não carregou. Nenhum valor saiu do cofre — recarregue a página em instantes.':
    "The balance didn't load. No money left the vault — reload the page in a moment.",
  'O cofre ainda não existe': "The vault doesn't exist yet",
  'O cofre ainda não existe na rede. Criar leva alguns segundos.':
    "The vault doesn't exist on the network yet. Creating it takes a few seconds.",
  'Criar o cofre': 'Create the vault',
  'Criar cofre 2 de 3': 'Create 2-of-3 vault',
  'Criando o cofre 2 de 3': 'Creating the 2-of-3 vault',
  'Cofre não criado': 'Vault not created',
  'Lendo o cofre…': 'Reading the vault…',
  'Não conseguimos ler o cofre agora.': "We couldn't read the vault now.",
  'Não conseguimos falar com o cofre agora': "We couldn't reach the vault now",
  'Não conseguimos falar com o cofre agora.': "We couldn't reach the vault now.",
  'Nada mudou no cofre. Tente recarregar em instantes.': 'Nothing changed in the vault. Try reloading in a moment.',
  '1 pessoa pediu para entrar': '1 person asked to join',
  'retidos': 'held',
  'saída': 'payout',
  'entrada': 'income',

  // ── Aprovações
  'Aguardando você': 'Waiting for you',
  'Aguardando a segunda assinatura': 'Waiting for the second signature',
  'aguardando o segundo signatário': 'waiting for the second signer',
  'aguardando': 'waiting',
  'Sem sua assinatura ainda': 'Not signed by you yet',
  'Assinar e executar': 'Sign and execute',
  'Assinar como': 'Sign as',
  'Avisar': 'Notify',
  'Você está como': 'You are signed in as',
  'Saída retida pelo cofre': 'Payout held by the vault',
  'Ao assinar, a saída é executada na hora.': 'Once signed, the payout is executed right away.',
  'Falta a assinatura de outro signatário. Ao assinar, a saída é executada na hora.':
    "Another signer's signature is missing. Once signed, the payout is executed right away.",
  'Falta a assinatura da outra pessoa da diretoria. Ao assinar, a saída é executada na hora.':
    "The other board member's signature is missing. Once signed, the payout is executed right away.",
  '} para o quórum. Ao assinar, a saída é executada na hora.': 'for quorum. Once signed, the payout is executed right away.',
  'Sua assinatura já está registrada. Falta a de outro signatário — só a própria pessoa pode assinar pelo lugar dela.':
    'Your signature is already recorded. Another signer is missing — only each person can sign for their own seat.',
  'Seu acesso é de associado. Quem assina é a diretoria.': 'You have member access. The board signs.',
  'Enquanto o quórum não fecha, o valor permanece no cofre. Nenhuma cobrança é feita e nada é enviado ao banco.':
    'Until quorum is reached, the money stays in the vault. Nothing is charged and nothing is sent to the bank.',
  'As propostas não carregaram. Nenhum valor saiu do cofre — recarregue a página em instantes.':
    "The proposals didn't load. No money left the vault — reload the page in a moment.",
  'A diretoria precisa de duas pessoas': 'The board needs two people',
  'Falta um segundo assinante': 'A second signer is missing',
  'Hoje só': 'Today only',
  'uma pessoa': 'one person',
  'pode assinar. Promova outra pessoa a presidência, tesouraria ou conselho fiscal em Sócios ativos — assim que isso acontecer, esta tela se atualiza sozinha.':
    'can sign. Promote someone else to president, treasurer or audit board in Active members — as soon as you do, this screen updates by itself.',
  'Nada aguardando assinatura': 'Nothing waiting for signature',
  'Nenhuma saída retida': 'No payouts held',
  'Quando alguém da diretoria propuser uma saída, ela aparece aqui e fica retida até juntar':
    'When a board member proposes a payout, it shows up here and stays held until it gathers',
  'assinaturas.': 'signatures.',
  'assinaturas': 'signatures',
  'Nenhuma proposta para levar ao cofre': 'No proposal to take to the vault',
  'Cadastre uma saída em propostas para acompanhar a execução com as duas assinaturas.':
    'Register a payout proposal to follow its execution with the two signatures.',
  'Ninguém assinou ainda': 'Nobody has signed yet',
  'assinatura pendente': 'signature pending',
  '1ª assinatura registrada': '1st signature recorded',
  '2ª assinatura registrada': '2nd signature recorded',
  'Quórum de 2 de 3 cumprido': '2-of-3 quorum met',
  'Executar saída · quórum atingido': 'Execute payout · quorum reached',
  'Executada': 'Executed',
  'Enviando a saída': 'Sending the payout',
  'Registrando a saída no cofre': 'Registering the payout in the vault',
  'Registrar no cofre': 'Register in the vault',
  'Proposta fora do cofre': 'Proposal outside the vault',
  'proposta fora da rede': 'proposal off the network',
  'Esta saída existe no livro, mas ainda não foi levada ao cofre. Sem isso ninguém consegue assinar.':
    "This payout is in the ledger but hasn't been taken to the vault yet. Without that nobody can sign.",
  'Nenhum cofre existe ainda na rede. Criar leva alguns segundos e já deixa esta saída esperando assinatura.':
    'No vault exists on the network yet. Creating one takes a few seconds and leaves this payout waiting for signature.',
  'Aguardando a confirmação da rede': 'Waiting for network confirmation',
  'Pode fechar o app — avisamos ao terminar.': "You can close the app — we'll let you know when it's done.",
  '· normalmente 3 a 12 segundos': '· usually 3 to 12 seconds',
  'Nada foi perdido: nenhum valor saiu e sua assinatura pode ser enviada de novo.':
    'Nothing was lost: no money left and your signature can be sent again.',
  'Nada foi perdido e nenhum valor saiu. Tente de novo em instantes.':
    'Nothing was lost and no money left. Try again in a moment.',
  'Ver a tentativa recusada': 'See the rejected attempt',
  'Nenhum valor saiu: o caixa segue com': 'No money left: the treasury still holds',
  'SOL na devnet.': 'SOL on devnet.',
  'Comprovante de saída': 'Payout receipt',
  'Comprovante no livro-caixa': 'Receipt in the ledger',
  'Já está no livro-caixa': 'Already in the ledger',
  'Publicado no livro-caixa': 'Published in the ledger',
  'Publicado automaticamente aos associados': 'Automatically published to members',
  'Ver o comprovante na rede ›': 'See the receipt on the network ›',
  'Referência da transação': 'Transaction reference',
  'SOL · destino recebeu': 'SOL · recipient received',
  'Assinatura digital': 'Digital signature',
  'Assinaturas': 'Signatures',
  'Ativa neste dispositivo': 'Active on this device',
  'Falta sua assinatura para liberar uma saída': 'Your signature is needed to release a payout',
  'Falta a sua assinatura para o quórum. Abra o link abaixo, entre com a sua conta e assine pelo seu lugar:':
    'Your signature is needed for quorum. Open the link below, sign in with your account and sign for your seat:',
  'sem e-mail': 'no email',
  'signatário': 'signer',
  'chave': 'key',
  'proposta #': 'proposal #',
  'Aprovada': 'Approved',
  'Pendente': 'Pending',

  // ── Propor
  'Para quem': 'To whom',
  'Destinatário': 'Recipient',
  'Chave do destinatário': 'Recipient key',
  'Valor da saída': 'Payout amount',
  'Rubrica': 'Category',
  'Diga para quem é a saída.': 'Say who the payout is for.',
  'Informe a chave do destinatário.': "Enter the recipient's key.",
  'Valor inválido. Use algo como 840,00.': 'Invalid amount. Use something like 840,00.',
  'CNPJ, e-mail ou telefone identificam quem recebe. Se você colar a chave de recebimento de outra entidade, o valor vai direto para o cofre dela.':
    "Tax ID, email or phone identify who receives it. If you paste another organization's receiving key, the money goes straight to its vault.",
  'A proposta nasce retida: nenhum valor sai do cofre enquanto não juntar duas assinaturas de três.':
    'The proposal starts held: no money leaves the vault until it gathers two of three signatures.',
  'Rubrica é a categoria contábil do lançamento, não a assinatura.':
    'Category is the accounting class of the entry, not the signature.',
  'Não conseguimos registrar a proposta agora.': "We couldn't register the proposal now.",
  'Não conseguimos registrar agora.': "We couldn't register now.",
  'Só a diretoria propõe saída': 'Only the board proposes payouts',
  'Propor uma saída é da presidência, da tesouraria e do conselho fiscal. O livro-caixa continua aberto a você, como a qualquer associado.':
    'Proposing payouts is for the president, treasury and audit board. The ledger stays open to you, as to any member.',
  'Uma saída precisa de': 'A payout needs',
  'assinaturas de pessoas da diretoria. Promova outra pessoa a presidência, tesouraria ou conselho fiscal em Sócios ativos — esta tela libera na hora.':
    'signatures from board members. Promote someone else to president, treasury or audit board in Active members — this screen unlocks right away.',
  'Publicado pela diretoria · toda saída exige': 'Published by the board · every payout requires',

  // ── Rubricas / papéis
  'Eventos': 'Events',
  'Marketing': 'Marketing',
  'Esporte': 'Sports',
  'Associados': 'Members',
  'Presidente': 'President',
  'Presidência': 'Presidency',
  'Tesoureira': 'Treasurer',
  'Tesoureiro': 'Treasurer',
  'Tesouraria': 'Treasury',
  'Conselho fiscal': 'Audit board',
  'Sócia': 'Member',
  'Sócio': 'Member',
  'Sócio não assina': "Members don't sign",
  'Papel': 'Role',
  'Diretoria': 'Board',

  'Todas': 'All',
  'Todos': 'All',
  // ── Livro
  'Aberto a qualquer associado, sem login': 'Open to any member, no login',
  'Buscar lançamento': 'Search entry',
  'Limpar filtro': 'Clear filter',
  'Nenhum lançamento com esse filtro': 'No entries with this filter',
  'O livro-caixa tem lançamentos — nenhum deles casa com o que você procurou.':
    'The ledger has entries — none of them match your search.',
  'Livro-caixa ainda sem lançamentos': 'Ledger has no entries yet',
  'A primeira entrada aparece aqui automaticamente': 'The first income shows up here automatically',
  'Livro-caixa não encontrado': 'Ledger not found',
  'Nenhuma entidade com esse endereço, ou o livro-caixa dela está fechado.':
    'No organization at this address, or its ledger is closed.',
  'Não conseguimos abrir o livro-caixa agora': "We couldn't open the ledger now",
  'O extrato não carregou. Nada mudou no cofre — tente recarregar a página em instantes.':
    "The statement didn't load. Nothing changed in the vault — try reloading the page in a moment.",
  'Saldo após': 'Balance after',
  'no período': 'in the period',
  'sem lançamentos': 'no entries',
  'Livro-caixa da entidade aberto em': "Organization's ledger opened on",
  'Visível aos': 'Visible to',
  'associados': 'members',
  'associados agora': 'members now',
  'Público, sem depender da aprovação': 'Public, without waiting for approval',

  // ── Festas
  'Criar festa': 'Create party',
  'Criar nova festa': 'Create new party',
  'Nova festa': 'New party',
  'Nome da festa': 'Party name',
  'Dê um nome à festa.': 'Give the party a name.',
  'Escolha o dia e a hora.': 'Pick the day and time.',
  'Preço do ingresso': 'Ticket price',
  'Preço inválido. Use algo como 45,00.': 'Invalid price. Use something like 45,00.',
  'Diga quantos ingressos existem, no mínimo 1.': 'Say how many tickets exist, at least 1.',
  'Não conseguimos criar a festa agora.': "We couldn't create the party now.",
  'Só a diretoria cria festa': 'Only the board creates parties',
  'Criar evento é da presidência, da tesouraria e do conselho fiscal. Os cartazes continuam abertos a você, como a qualquer associado.':
    'Creating events is for the president, treasury and audit board. The posters stay open to you, as to any member.',
  'Crie um evento com dia, hora, preço e quantos ingressos existem — o cartaz dele abre sem conta nenhuma, para vender no link.':
    'Create an event with date, time, price and ticket count — its poster opens without any account, to sell through the link.',
  'O cartaz abre sem login e vende ingresso no link': 'The poster opens without login and sells tickets through the link',
  'O cartaz abre sem login, e cada ingresso vendido entra no livro-caixa como entrada, sem ninguém digitar nada.':
    'The poster opens without login, and every ticket sold enters the ledger as income, with nobody typing anything.',
  'Nenhuma festa na agenda': 'No parties scheduled',
  'Nenhuma na agenda': 'None scheduled',
  'A agenda não carregou': "The schedule didn't load",
  'Evento não encontrado': 'Event not found',
  'Nenhuma festa com esse endereço. Confira o link que você recebeu.':
    'No party at this address. Check the link you received.',
  'Não conseguimos abrir a festa agora': "We couldn't open the party now",
  'A página não carregou. Tente de novo em instantes — o link continua valendo.':
    "The page didn't load. Try again in a moment — the link still works.",
  'Ingressos à venda': 'Tickets on sale',
  'Ingressos esgotados': 'Sold out',
  'esgotado': 'sold out',
  'esgotados': 'sold out',
  'Quando': 'When',
  'Onde': 'Where',
  'Lotes': 'Batches',
  'apresenta': 'presents',
  'Acompanhe a entidade para saber do próximo lote.': 'Follow the organization to hear about the next batch.',
  'O dinheiro dos ingressos cai direto no cofre da entidade, e cada compra vira uma entrada no livro-caixa sem ninguém digitar nada.':
    "Ticket money goes straight into the organization's vault, and each purchase becomes ledger income with nobody typing anything.",
  'O valor cai direto no cofre da atlética. Nada passa por conta pessoal.':
    "The money goes straight into the club's vault. Nothing passes through a personal account.",
  'Abrindo a compra…': 'Opening checkout…',
  'Não conseguimos abrir a compra agora.': "We couldn't open checkout now.",
  'Nada foi cobrado. Tente de novo — o ingresso continua disponível.':
    'Nothing was charged. Try again — the ticket is still available.',
  'Pague pelo QR e receba na hora': 'Pay by QR and get it instantly',
  'Aponte a câmera do app de pagamento para o código. O valor cai direto no cofre da entidade.':
    "Point your payment app's camera at the code. The money goes straight into the organization's vault.",
  'Pagar pela carteira de demonstração': 'Pay with the demo wallet',
  'Pagamento confirmado': 'Payment confirmed',
  'A pagar': 'To pay',
  'Referência da compra': 'Purchase reference',
  'Assim que o pagamento entrar, o ingresso é emitido e a entrada aparece sozinha no':
    'As soon as the payment arrives, the ticket is issued and the income shows up by itself in the',
  '· o valor caiu no cofre da entidade e já está no livro-caixa.':
    "· the money landed in the organization's vault and is already in the ledger.",
  'apresenta': 'presents',
  'A diretoria da': 'The board of',

  // ── Receber
  'Receber dinheiro na chave da entidade': "Receive money on the organization's key",
  'A chave da entidade, para entrar dinheiro no cofre': "The organization's key, to bring money into the vault",
  'Chave da entidade': 'Organization key',
  'Copiar chave': 'Copy key',
  'Caixa do cofre na devnet': 'Vault treasury on devnet',
  'Não deu para copiar. Selecione a chave e copie à mão.': "Couldn't copy. Select the key and copy it by hand.",
  'A chave não carregou. Nada mudou no cofre — tente de novo em instantes.':
    "The key didn't load. Nothing changed in the vault — try again in a moment.",
  'A chave para receber é o caixa do cofre. Assim que o cofre existir, ela aparece aqui e a entidade já pode receber.':
    'The receiving key is the vault treasury. Once the vault exists, it shows up here and the organization can receive.',
  'Quem quiser pagar a entidade — outra liga, um patrocinador, um associado — envia para essa chave. O dinheiro cai no caixa do cofre, que continua exigindo duas assinaturas para qualquer saída.':
    "Anyone who wants to pay the organization — another club, a sponsor, a member — sends to this key. The money lands in the vault treasury, which still requires two signatures for any payout.",

  // ── Sócios
  'A lista não carregou': "The list didn't load",
  'Nenhum associado ainda': 'No members yet',
  'Quando a diretoria cadastrar as pessoas, elas aparecem aqui.': 'When the board registers people, they show up here.',

  // ── Perfil
  'Dados pessoais': 'Personal data',
  'Editar dados pessoais': 'Edit personal data',
  'Escolher foto': 'Choose photo',
  'Trocar foto': 'Change photo',
  'Remover foto': 'Remove photo',
  'Nome': 'Name',
  'Curso': 'Course',
  'Período': 'Semester',
  'Salvar': 'Save',
  'O nome não pode ficar em branco.': "The name can't be empty.",
  'Esse arquivo não parece ser uma imagem.': "This file doesn't look like an image.",
  'Não deu para usar essa imagem.': "Couldn't use this image.",
  'Não foi possível preparar a foto neste aparelho.': "Couldn't prepare the photo on this device.",
  'Não conseguimos salvar agora. Tente de novo em instantes.': "We couldn't save now. Try again in a moment.",
  'Seus dados não carregaram. Tente recarregar em instantes.': "Your data didn't load. Try reloading in a moment.",

  // ── Configuração
  'Falta configurar o acesso ao banco': 'Database access is not configured',
};

/** Frases montadas com valores no meio. Ordem importa: a primeira que casa vence. */
export const PADROES: [RegExp, (...m: string[]) => string][] = [
  [/^hoje, (\d{1,2}:\d{2})$/, (_, h) => `today, ${h}`],
  [/^(\d+) de (\d+) assinaturas$/, (_, a, b) => `${a} of ${b} signatures`],
  [/^(\d+) de (\d+)$/, (_, a, b) => `${a} of ${b}`],
  [/^Cofre (\d) de (\d) na rede$/, (_, a, b) => `${a}-of-${b} vault on the network`],
  [/^Quórum completo · (\d+) de (\d+)$/, (_, a, b) => `Quorum complete · ${a} of ${b}`],
  [/^Retida até juntar (\d) de (\d) assinaturas$/, (_, a, b) => `Held until ${a} of ${b} signatures`],
  [/^Nenhuma saída sem (\d) assinaturas$/, (_, a) => `No payout without ${a} signatures`],
  [/^Falta 1 assinatura para o quórum\. (.*)$/, () => '1 signature missing for quorum. Once signed, the payout is executed right away.'],
  [/^Faltam (\d+) assinaturas para o quórum\. (.*)$/, (_, n) => `${n} signatures missing for quorum. Once signed, the payout is executed right away.`],
  [/^Falta a assinatura de (.+)\. Ao assinar, a saída é executada na hora\.$/, (_, n) => `Missing ${n.replace(/ ou de /g, ' or ')}'s signature. Once signed, the payout is executed right away.`],
  [/^(.+) assinou às (.+)$/, (_, n, h) => `${n} signed at ${h}`],
  [/^(.+) assinou$/, (_, n) => `${n} signed`],
  [/^Assinar como (.+)$/, (_, n) => `Sign as ${n}`],
  [/^Assinatura de (.+)$/, (_, n) => `${n}'s signature`],
  [/^Avisar (.+)$/, (_, n) => `Notify ${n}`],
  [/^(.+) sem e-mail cadastrado$/, (_, n) => `${n} has no email on file`],
  [/^Aprovar (.+)$/, (_, n) => `Approve ${n}`],
  [/^Recusar (.+)$/, (_, n) => `Decline ${n}`],
  [/^Mudar o papel de (.+)$/, (_, n) => `Change ${n}'s role`],
  [/^Retrato de (.+)$/, (_, n) => `Portrait of ${n}`],
  [/^(\d+) pendentes?$/, (_, n) => `${n} pending`],
  [/^(\d+) propostas?$/, (_, n) => `${n} ${n === '1' ? 'proposal' : 'proposals'}`],
  [/^(\d+) associados?$/, (_, n) => `${n} ${n === '1' ? 'member' : 'members'}`],
  [/^(\d+) associados? · (\d+) assinam$/, (_, n, a) => `${n} ${n === '1' ? 'member' : 'members'} · ${a} sign`],
  [/^(\d+) pessoas pediram para entrar$/, (_, n) => `${n} people asked to join`],
  [/^(.+) · (\d+) signatários$/, (_, e, n) => `${e} · ${n} signers`],
  [/^(\d+) eventos? · a página de cada uma abre sem login$/, (_, n) => `${n} ${n === '1' ? 'event' : 'events'} · each page opens without login`],
  [/^restam (\d+) de (\d+)$/, (_, a, b) => `${a} of ${b} left`],
  [/^(.+) · quórum atingido$/, (_, n) => `${n} · quorum reached`],
  [/^Comprar · (.+)$/, (_, v) => `Buy · ${v}`],
  [/^Uma saída de (.+) para (.+) está retida no cofre\.$/, (_, v, d) => `A payout of ${v} to ${d} is held in the vault.`],
  [/^Enviamos um e-mail para (.+)\. Toque no link para confirmar e depois entre com sua senha\.$/, (_, e) => `We sent an email to ${e}. Tap the link to confirm, then sign in with your password.`],
  [/^Se existe conta com (.+), o e-mail com o link para escolher uma nova senha já saiu\.$/, (_, e) => `If an account exists for ${e}, the email with the link to choose a new password is on its way.`],
  [/^Atlética · (.*)$/, (_, u) => `Athletics club · ${u}`],
  [/^(Dom|Seg|Ter|Qua|Qui|Sex|Sáb), (\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) · (\d{1,2})h(\d{2})?$/i, (_, w, d, m, h, mi) => `${SEMANA[w.toLowerCase()]}, ${MESES[m.toLowerCase()]} ${d} · ${fmtHora(+h, mi)}`],
  [/^(\d+)º lote · (.+)$/, (_, n, t) => `${ordinal(+n)} batch · ${t.replace(/^não sócios?$/i, 'non-member').replace(/^sócios?$/i, 'member').replace(/^geral$/i, 'general').replace(/^estudante$/i, 'student')}`],
  [/^(\d+)º lote$/, (_, n) => `${ordinal(+n)} batch`],
  [/^Entrada recebida na chave da entidade$/, () => 'Payment received on the organization key'],
  [/^Entrada recebida de (.+)$/, (_, n) => `Payment received from ${n}`],
  [/^Lote (.+)$/, (_, n) => `Batch ${n}`],
  [/^(\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?$/i, (_, d, m) => `${MESES[m.toLowerCase()]} ${d}`],
];

const MESES: Record<string, string> = {
  jan: 'Jan', fev: 'Feb', mar: 'Mar', abr: 'Apr', mai: 'May', jun: 'Jun',
  jul: 'Jul', ago: 'Aug', set: 'Sep', out: 'Oct', nov: 'Nov', dez: 'Dec',
};

const SEMANA: Record<string, string> = {
  dom: 'Sun', seg: 'Mon', ter: 'Tue', qua: 'Wed', qui: 'Thu', sex: 'Fri', 'sáb': 'Sat',
};
function fmtHora(h: number, mi?: string) {
  const s = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${mi ? ':' + mi : ''} ${s}`;
}
function ordinal(n: number) {
  const r = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${r}`;
}
