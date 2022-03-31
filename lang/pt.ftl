### Small words
id = ID
type = Type
dm = dm
serv = server

### Help messages
# This is in the help message header
helpHeader = {-bot-name} está aqui!

# The main help message body, followed by usage
helpIntro =
  Olá, eu sou { -bot-name }, sou um bot bem simples que faz cross-posts de posts do twitter no Discord!
  {-b}Leia minha [documentação completa]({ -docs-url }){-b}
  {-b}Quer me convidar para o seu servidor?{-b} [Clique aqui]({ -invite-url })!
  {-b}Problemas, perguntas?{-b} [Temos um servidor de apoio!]({ -support-server })
  {-b}Quer ajudar o QTweet?{-b} [Faça uma doação pelo Patreon!]({ -patreon-link })
  
  Aqui está uma pequena lista de comandos para te ajudar a começar:

pingReply = Meu prefixo nesse servidor é {$prefix}.

# Footer giving credit to the artist
helpFooter = Foto de perfil por {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Olá, eu sou {-bot-name}, obrigado por me convidar para seu servidor!
      {-b}Para começar:{-b} `{-pr}help` para comandos e links úteis!
      {-b}Se eu sou útil no seu servidor{-b}, por favor cosidere um upvote em {-profile-url}
      
      Ao usar qualquer um de meus comandos, você concorda que {-b}qualquer conteúdo postado no seu servidor ou DMs por mim é sua própria responsabilidade{-b}, confira minha documentação para mais informações.

### Command usage

# The word "usage"
-usage = Uso
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = nome_de_usuario_twitter

## Usage for every command
usage-tweet = 
  Posta o(s) último(s) tweet(s) do usuário especificado.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=contagem]`

usage-start =
  Inscreva um usuário do twitter and poste os seus posts em tempo real.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [opções]`
  Suporta múltiplos usuários, retweets, filtragem de textos dos posts e mais! Confira a documentação!

usage-stop = 
  Remova a inscrição do usuário mencionado.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Exatamente igual a {-pr}stop mas age no canal inteiro.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Exibe a lista de inscrições deste canal.

usage-lang = 
  Lista os idiomas disponíveis ou troca de idioma.
  Leia a documentação quiser ajudar a me traduzir para seu idioma!
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <idioma>]`
usage-lang-set = {-usage}: `{-pr}lang set <idioma>`

usage-qtprefix =
  Muda o prefixo usado para interagir comigo.
  Você precisa ser um mod do **server inteiro** para fazer isso!
  {-b}{-usage}{-b}: `{-pr}qtprefix <novo_prefixo>`

usage-tweetid =
  Posta o twitter formatado com o ID especificado.
  {-b}{-usage}{-b}: `{-pr}tweetid <id_do_tweet>`


### Command feedback
-error-apology = Trabalhando nisso, desculpe pelo problema!
## !!tweet
countIsNaN =
  {-b}Eu preciso de um número de tweets para pegar!{-b}
  Ei, {$count} não é um número! >:c

tweetCountLimited = 
  {-b}Limitado a {$maxCount} tweets{-b}
  Você não é um mod então tenho que limitar você - aqui estão os últimos {$maxCount} tweets!

tweetCountUnderOne =
  {-b}Você me pediu pra postar {$count} tweets, então não vou postar nenhum{-b}
  Boa tentativa~

tweetCountHighConfirm =
  {-b}Você está pedindo vários tweets{-b}
  Você tem certeza que quer que eu poste {$count} tweets? Quando eu começar, você não poderá me parar!
  Se você tem certeza que quer que eu faça isso, digite:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Eu tentei pegar um tweet de {$screenName} mas o Twitter me disse que isso não é autorizado.{-b}
  Isso é geralmente causado por uma conta bloqueada.

tweetUnknwnError =
  {-b}{$screenName} existe mas algo parece errado com esse perfil{-b}
  Eu não consigo pegar a timeline deles... Twitter tinha isso a dizer:
  {$error}

noTweets = Não parece que {$screenName} tem algum tweet...

noValidTweets =
  {-b}Este usuário não parece ter algum tweet válido{-b}
  Você poderia tentar de novo, talvez o Twitter se enganou?

tweetGeneralError = 
  {-b}Algo deu errado pegando tweets de {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Algo deu errado pegando o tweet {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Algo deu errado pegando as informações para{$namesCount ->
  [one] esta conta
  *[other] estas contas
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Você se inscreveu para {$addedObjectName}!{-b}
  Lembre-se que você pode me parar a qualquer momento com `{-pr}stop {$nameCount ->
    [1] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Pode demorar até 20min para começar a pegar os tweets deles, mas quando começar, serão em tempo real!

  {$missedNames ->
    [0] {""}
    *[other] Também parece que não consegui encontrar alguns dos usuários que você especificou, veja se você usou o nickname deles!
  }

# This is how we display multiple names.
# If we only have one, we display it, if we have multiple we display them, then add the last one.
formatUserNames = {$count ->
    [1] {$lastName}
    *[other] {$names} and {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} atualizado!{-b}
  Suas novas opções foram registradas. As mudanças devem ser instantâneas.

## !!leaveguild
noValidGid = Não foi especificado um guild ID válido

guildNotFound = Não consegui encontar a guild {$guild}.

## !!stop
noSuchSubscription =
  {-b}Não inscrito para {$screenNames}{-b}
  Use `{-pr}list` para uma lista de inscrições!

stopSuccess =
  {-b}Eu removi sua inscrição de {$screenNames}{-b}
  Você não deve mais receber qualquer tweets deles.

## !!stopchannel
stopChannelInDm =
  {-b}Use esse comando no servidor que você quer parar{-b}
  Você não tem que usar um argumento na DM. Se você quer parar todas as inscrições apenas digite `{-pr}stopchannel`.

noSuchChannel =
  {-b}Não pude encontrar o canal {$targetChannel} no seu servidor.{-b}
  Se você o deletou, eu provavelmente já saí dele, não se preocupe!

stopChannelSuccess =
  {-b}Eu removi sua inscrição de {$subs ->
    [one] um usuário
    *[other] {$subs} usuários
  }.{-b}
  Você deve parar de receber qualquer tweet deles em `{$channelName}`.

## !!lang
noSuchLang =
  {-b}Não tenho suporte pra esse idioma{-b}
  Você pode digitar `{-pr}lang list` para ver uma lista de idiomas suportados

langSuccess =
  {-b}Idioma alterado com sucesso{-b}
  Bem-vindo ao mágico mundo do português!

prefixSuccess =
  {-b}Prefixo alterado com sucesso{-b}
  Você agora terá que usar {$prefix} para eu te entender!

## General
invalidVerb = 
  {-b}Falha no comando{-b}
  Verbo inválido: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Eu não consegui encontrar {$count ->
    [1] um usuário do Twitter pelo nome de
    *[other] nenhum desses usuários:
  } {$name}.{-b}
  Você deve tentar usar {$count ->
    [1] o nome de usuário dele
    *[other] os nomes de usuários deles
  } e não o twitter {$count -> 
    [1] handle deles
    *[other] handles deles
  }.

tooManyUsersRequested =
  {-b}Muitos usuários solicitados{-b}
  Parece que eu solicitei usuários demais para o twitter. Isso não devia acontecer, mas enquanto isso tente solicitar menos usuários!

noSuchTwitterId =
  {-b}ID inexistente{-b}
  Twitter disse que não tem tweet com esse id!

twitterUnknwnError =
  {-b}Algo deu errado ao interagir com o twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Comando de dono do bot
# Generic error indicator
-notAuthorized = Não autorizado

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Desculpe, apenas meu dono pode fazer anúncios!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Esse comando só é permitido em DMs.
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Apenas moderadores podem remover a inscrição de uma conta no twitter!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Para se inscrever para uma conta no twitter você precisa ser um moderador ou ter o cargo apropriado!
langForMods =
  {-b}{-notAuthorized}{-b}
  Apenas moderadores do nível do servidor podem desempenhar comandos de idioma!
prefixForMods = 
  {-b}{-notAuthorized}{-b}
  Apenas moderadores do nível do servidor podem mudar o prefixo!
### Lists
genericEmptyList = Lista está vazia, nada para mostrar.

noUserSubscriptions = 
  {-b}Este usuário não tem inscrições{-b}
  Isso não deveria acontecer :c

noSubscriptions = 
  {-b}Você não se inscreveu para ninguém{-b}
  Use `{-pr}start <{-screen-name-variable}>` para começar!

# Flag formatting is on one line, in plain text
formatFlags = With {$notext -> 
    *[0] posts de texto
    [1] sem posts de texto
  }, {$retweet ->
    *[0] sem retweets
    [1] retweets
  }, {$noquote ->
    *[0] citações
    [1] sem citações
  } and {$replies -> 
    *[0] sem respostas
    [1] respostas
  } sendo postados.

genericObjects = {$count} {$count -> 
    [one] objeto
    *[other] objetos
  }

subscriptions = {$count} {$count -> 
    [one] inscrição
    *[other] inscrições
  }

languages = {$count} {$count -> 
    [one] idioma
    *[other] idiomas
  }

### Posting errors
postPermissionError =
  {-b}Permissões ausentes:{-b} Eu não consigui mandar uma mensagem em {$name}.
  Se um mod pudesse me dar as permissões {-b}Enviar Mensagens{-b}, {-b}Enviar Embeds{-b} e {-b}Anexar Arquivos{-b} seria muito legal.
  Se você quer que eu pare de tentar mandar mensagens lá, moderadores podem usar `{-pr}stopchannel {$id}`.
  Se você acha que já fez tudo certinho mas continua recebendo essa mensagem, entre no nosso servidor de suporte, o link está na mensagem de `{-pr}help`.

### User Limit D:
userLimit =
  {-b}Eu atingi meu limite de usuários!{-b} Sua inscrição continha contas que mais ninguém se inscreveu, então eu tive que descartá-la.

  {-b}Por que você faria isso?{-b}
  Twitter atualmente limita todo app a 5 000 inscrições. Se você está lendo isso, eu atingi aquele limite, e eu não tenho escolha - se eu pedir por mais usuários, então tudo iria quebrar para todo mundo.

  {-b}O que você está fazendo para arrumar isso?{-b}
  Tenho pensado muito mesmo para tentar e encontrar opções para resolver a situação, e tem sido muito estressante para mim, porque eu realmente quero que todos tenham seus tweets. Mas no momento nenhuma opção parece perfeita.
  Você pode encontar uma thread no topic aqui se você quiser propor alguma solução: https://github.com/atomheartother/QTweet/issues/32

  {-b}Eu posso ajudar?{-b}
  Se você leu a thread que eu postei logo acima, vai ver várias opções que vão me custar dinheiro. Se você gostaria de ajudar e tornar possível para oQTweet funcionar melhor para todos, você pode apoiar o desenvolvimento do QTweet no Patreon - todo centavo conta: https://www.patreon.com/atomheartother

  {-b}Como posso ter os tweets nesse meio-tempo?{-b}
  Você tem umas poucas soluções se você realmente quer que essas contas postadas no seu servidor:
  - {-b}Hospede sua própria versão do QTweet{-b}: Eu realmente recomendo fazer isso, QTweet é código-aberto e livre, e você pode rodar-la de qualquer computador ou servidor. Você pode ler mais na mensagem `!!help` e contactar minha criadora se você precisar de ajuda.
  - {-b}Remova algumas de suas inscrições{-b} se você tiver alguma, para liberar um espaço - note que se outro servidor está inscrito nessa conta, isso não vai funcionar infelizmente.
  - {-b}Encontre uma alternativa ao QTweet{-b}: É, isso aí, se essas opções não funcionarem para você tenho medo de não poder fazer mais nada por você!

### Credit
languageCredit = Português do Brasil, feito por `LeonardoBagi#4702`
