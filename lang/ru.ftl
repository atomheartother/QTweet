### Small words
id = ID
type = ТИП
dm = dm
serv = Сервер

### Help messages
# This is in the help message header
helpHeader = {-bot-name} здесь!

# The main help message body, followed by usage
helpIntro =
  Здравствуйте, я {-bot-name }, я очень простой бот, который постит сообщения twitter, на ваш сервер!
 {-b}Вы должны прочитать мою [полную документацию]({-docs-url}) {-b}
 {-b}Хотите пригласить меня на свой сервер?{-b} [Нажмите здесь]({-invite-url })!
 {-b}Вопросы, проблемы?{-b} [У нас есть сервер поддержки!]({-support-server })
 {-b}Хотите поддержать пожертвованием на развитие QTweet?{-b} [Сделайте пожертвование в Patreon!]({-patreon-link })
 
  Вот краткий список команд для начала работы:

# Footer giving credit to the artist
helpFooter = Арт сделан {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Привет, Я {-bot-name}, спасибо, что пригласили меня на свой сервер!
      {-b}Для начала:{-b} `{-pr}help` команды и полезные ссылки!
      {-b}Если я полезен для вашего сервера{-b}, пожалуйста, перейдите по этой ссылки {-profile-url} и проголосуйте
      
      Используя любую из моих команд, вы соглашаетесь с тем что, {-b} любой контент, публикуемый на ваш сервер или DM через меня, является вашей собственной ответственностью{-b}, ознакомьтесь с моей документацией для получения дополнительной информации.

### Command usage

# The word "usage"
-usage = Пример
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_имя

## Usage for every command
usage-tweet = 
  Опубликовать последние твиты от данного пользователя.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  Подпишитесь на пользователя twitter и я буду опубликовывать его твиты в режиме реального времени.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Поддержка нескольких пользователей, ретвитов, фильтрации текстовых сообщений и многое другое! Ознакомьтесь с документацией!

usage-stop = 
  Отписаться от данного пользователя.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Точно так же, как {-pr}stop, но действует на весь канал.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Показать список подписок этого канала.

usage-lang = 
  Показывает список доступных языков или изменяет язык.
  Прочитайте документы, если хотите помочь перевести меня на свой язык!
  {-usage}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

### Command feedback
-error-apology = Я занимаюсь этим, извините за неприятности!
## !!tweet
countIsNaN =
  {-b}Мне нужно число твитов!{-b}
  ЭЙ, {$count} не число! >:c

tweetCountLimited = 
  {-b} Ограничено {$maxCount} твитами{-b}
  Вы не MOD, поэтому я должен ограничить вас - Вот ваш лимит: {$maxCount} твитов!

tweetCountUnderOne =
  {-b}Вы попросили меня опубликовать {$count} твитов, поэтому я не буду опубликовать{-b}
   Хорошая попытка~

tweetCountHighConfirm =
  {-b}Вы просите много твитов{-b}
  Вы уверены, что хотите чтобы я опубликовал {$count} твитов? Как только я начну, ты не сможешь остановить меня!
  Если вы уверены, что хотите чтобы я это сделал, запустите:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Я пытался получить твит от {$screenName} но Twitter сообщает, что он не зарегистрирован.{-b}
  Обычно это вызвано заблокированной учетной записью.

tweetUnknwnError =
  {-b}{$screenName} существует, но что-то не так с их профилем{-b}
  Я не могу получить их график ... Твиттер сказал:
  {$error}

noTweets = Не похоже, что у {$screenName} есть твиты...

noValidTweets =
  {-b}У этого пользователя нет действительных твитов{-b}
  Попробуйте еще раз, может быть, Twitter испортился?

tweetGeneralError = 
  {-b}Что-то пошло не так, получая твиты от {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Что-то пошло не так, получая твит {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Что-то пошло не так, чтобы получить информацию для {$namesCount ->
  [one] этого аккаунта
  *[other] этих аккаунтов
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Теперь вы подписаны на {$addedObjectName}!{-b}
  Помните, что вы можете остановить меня в любое время с помощью `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Это может занять до 20 минут, чтобы я начал получать твиты от них, но как только это начнется, то твиты будут в режиме реального времени!

  {$missedNames ->
    [0] {""}
    *[other] Кажется, что я не смог найти некоторых из указанных вами пользователей, убедитесь, что вы использовали настоящий ник!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} и {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} обновлен!{-b}
  Ваши новые флаги были зарегистрированы. Изменения должны быть мгновенными.

## !!leaveguild
noValidGid = Действительный идентификатор гильдии не указан

guildNotFound = Я не смог найти гильдию  {$guild}.

## !!stop
noSuchSubscription =
  {-b}Не подписан на {$screenNames}{-b}
  Используйте `{-pr}list` для получения списка подписок!

stopSuccess =
  {-b}Я отписался от {$screenNames}{-b}
  Вы должны прекратить получать от них какие-либо твиты.

## !!stopchannel
stopChannelInDm =
  {-b}Используйте эту команду на сервере, на котором вы хотите настроить твиты{-b}
  Вам не нужно использовать аргумент в DMs. Если вы хотите остановить все подписки DM просто запустите `{-pr}stopchannel`.

noSuchChannel =
  {-b}Я не смог найти канал {$targetChannel} на вашем сервере.{-b}
  Если вы удалили его, я вероятно уже оставил его, не волнуйтесь!

stopChannelSuccess =
  {-b}Я отписался от {$subs ->
    [one] пользователя
    *[other] {$subs} пользователи
  }.{-b}
  Теперь вы должны прекратить получать какие-либо твиты {$channelName}.

## !!lang
noSuchLang =
  {-b}Я не поддерживаю этот язык{-b}
  Вы можете использовать `{-pr}lang list` чтобы просмотреть список поддерживаемых языков

langSuccess =
  {-b}Язык успешно изменен{-b}
  Добро пожаловать в волшебный мир русского языка!

## General
invalidVerb = 
  {-b}Не удалось выполнить команду{-b}
  Неверный глагол: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Я не могу найти {$count ->
    [1] пользователя Twitter по имени
    *[other] любого из этих пользователей:
  } {$name}.{-b}
  Вы, скорее всего, пытались использовать их имя {$count ->
    [1] пользователя
    *[other] пользователи
  } а не их twitter {$count -> 
    [1] ник
    *[other] ники
  }.

tooManyUsersRequested =
  {-b}Слишком много пользователей запросили{-b}
  Кажется, вы запросили слишком много пользователей в twitter. Этого не должно было произойти, но в то же время попробуйте запросить меньше пользователей!

noSuchTwitterId =
  {-b}Нет такого ID{-b}
  Twitter говорит, что нет никакого твита с этим ID!

twitterUnknwnError =
  {-b}Что-то пошло не так, взаимодействуя с twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Команда владельца бота
# Generic error indicator
-notAuthorized = Неавторизованный

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Извините, только мой владелец может сделать объявления!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Эта команда разрешена только в DMs.
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Только модераторы могут отказаться от подписки на аккаунт twitter!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Чтобы подписаться на аккаунт twitter, вы должны быть модератором или иметь соответствующую роль!
langForMods =
  {-b}{-notAuthorized}{-b}
  Только модераторы могут выполнять языковые команды!

### Lists
genericEmptyList = Список пуст, ничего не отображать.

noUserSubscriptions = 
  {-b}У этого пользователя нет подписок{-b}
  Этого не должно было случиться :c

noSubscriptions = 
  {-b}Вы ни на кого не подписаны{-b}
  Используйте `{-pr}start <{-screen-name-variable}>` для начала!

# Flag formatting is on one line, in plain text
formatFlags = C {$notext -> 
    *[0] текстовыми постами
    [1] нет текстовых постов
  }, {$retweet ->
    *[0] нет ретвитов
    [1] с ретвитами
  }, {$noquote ->
    *[0] с двойными кавычками
    [1] без кавычек
  }.

genericObjects = {$count} {$count -> 
    [one] объект		
    *[other] объектов
  }

subscriptions = {$count} {$count -> 
    [one] подписка
    *[other] подписок
  }

languages = {$count} {$count -> 
    [one] язык
    *[other] языков
  }

### Posting errors
postPermissionError =
  {-b}Отсутствуют Разрешения:{-b} Я не могу отправить сообщение в {$name}.
  Если модератор не смог дать мне {-b}Отправка Сообщений{-b}, {-b}Отправлять Ссылки{-b} and {-b}Прикреплять файлы{-b} разрешения там, что было бы неплохо.
  Если вы хотите, чтобы я прекратил попытки отправлять сообщения в каналы, модераторы могут использовать `{-pr}stopchannel {$id}`.
  Если вы считаете, что все сделали правильно, но продолжаете получать это сообщение, присоединяйтесь к нашему серверу поддержки, он связан в моем `{-pr}help` сообщение.

### User Limit D:
userLimit =
  {-b}Я достиг своего предела пользователя!{-b} Ваш запрос на подписку содержал учетные записи, на которые больше никто не подписывался, поэтому мне пришлось их удалить.

  {-b}Зачем ты это сделал?{-b}
  Twitter в настоящее время ограничивает каждое приложение до 5 000 подписок. Если Вы читаете это, я достиг этого предела, и у меня нет выбора - если я попрошу больше подписок, то все сломается.

  {-b}Что вы делаете, чтобы исправить это?{-b}
  Я очень много работал, чтобы попытаться найти варианты выхода из этой ситуации, и это было очень напряженно для меня потому что я действительно хочу, чтобы все получили свои твиты. Однако до сих пор ни один вариант не кажется идеальным.
  Вы можете найти тему по этой теме здесь, Если вы хотите предложить какие-либо решения: https://github.com/atomheartother/QTweet/issues/32

  {-b}Чем могу помочь?{-b}
  Если вы прочитаете тему, которую я опубликовал выше, вы увидите, что многие варианты будут стоить мне денег. Если вы хотите помочь и сделать так, чтобы QTweet работал лучше для всех, вы можете поддержать разработку QTweet на Patreon - каждый донат помогает: https://www.patreon.com/atomheartother

  {-b}Как мне получить мои твиты в то же время?{-b}
  У вас есть несколько вариантов, если вы действительно хотите, чтобы эти учетные записи были размещены на вашем сервере:
  - {-b}Разместите свою собственную версию QTweet{-b}: я бы очень рекомендовал сделать это, QTweet является бесплатным и открытым исходным кодом, и вы можете запустить ее с любого компьютера или сервера.  Вы можете прочитать больше в `!!help` о помощи и свяжитесь с моим создателем, если вам нужна помощь.
  - {-b}Удалите некоторых из ваших подписок {-b} если они у вас есть чтобы освободить место. Обратите внимание, что если другой сервер подписан на эту учетную запись, это к сожалению не сработает.
  - {-b}Найти альтернативу QTweet{-b}: Да, вот и все, если эти варианты не работают для вас, я боюсь что не могу сделать что-нибудь еще для вас!

### Credit
languageCredit = Русский перевод сделан: `†Роскомнадзор†#1415`
