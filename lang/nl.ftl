### Small words
id = ID
type = Type
dm = dm
serv = server

### Help messages
# This is in the help message header
helpHeader = {-bot-name} is here!

# The main help message body, followed by usage
helpIntro =
  Hallo, mijn naam is { -bot-name }, ik ben een simpele bot die Twitter posts cross-post naar je Discord server!
  {-b}Lees mijn complete documentatie [hier]({ -docs-url })!{-b}
  {-b}Wil je me toevoegen aan jouw server?{-b} [Klik hier]({ -invite-url })!
  {-b}Problemen of vragen?{-b} [QTweet heeft een support server!]({ -support-server })
  {-b}Wil je de ontwikkeling van QTweet steunen?{-b} [Maak een donatie op Patreon!]({ -patreon-link })
  Hier een korte lijst van commando's zodat je vlot kan beginnen:

# Footer giving credit to the artist
helpFooter = Profielfoto door: {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Hallo, mijn naam is {-bot-name}, bedankt voor de uitnodiging tot je server!
      {-b}Om te beginnen:{-b} `{-pr}help` voor mijn commando's en handige links!
      {-b}Als je mij handig vindt{-b}, overweeg om hier op mij te stemmen: {-profile-url}
      
      Als je gebruik maakt van mijn commando's ga je akkoord met het feit dat alle content die in jouw server of DMs gepost wordt {-b}je eigen verantwoordelijkheid is{-b}, lees mijn documentatie voor meer informatie.

### Command usage

# The word "usage"
-usage = Gebruik
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_screen_name

## Usage for every command
usage-tweet = 
  Post de meeste recente Tweet(s) van het gegeven account.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [count]`

usage-start =
  Abonneer op een Twitter account en post zijn/haar Tweets in real time.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Het is mogelijk om meerdere accounts tegelijk te volgen, ook kan je filteren op alleen afbeeldingen en meer, check de documentatie!  
usage-stop = 
  Stop met het volgen van dit account.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Werkt exact hetzelfde als {-pr}stop maar dan voor het volledige channel.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Post een lijst van de accounts die je op dit moment in dit channel volgt.

usage-admin = {-usage}: `{-pr}admin <channel|twitter|guild>`
usage-admin-channel = {-usage}: `{-pr}admin c <channel_id>`
usage-admin-twitter = {-usage}: `{-pr}admin t <{-screen-name-variable}>`
usage-admin-guild = {-usage}: `{-pr}admin g <guild_id>`

usage-lang = {-usage}: `{-pr}lang [list|set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

### Command feedback
## !!tweet
countIsNaN =
  {-b}Je moet me een hoeveelheid Tweets geven om binnen te halen!{-b}
  Hey, {$count} is geen getal! >:c

tweetCountLimited = 
  {-b}Maximaal {$maxCount} tweets{-b}
  Je bent geen mod dus je mag maar {$maxCount} Tweets opvragen - Hier heb je de {$maxCount} meest recente tweets!

tweetCountUnderOne =
  {-b}Je vroeg om {$count} tweets, dus ik hoef niks te posten.{-b}
  Nice try~

tweetCountHighConfirm =
  {-b}Je vraagt om heel veel Tweets tegelijk!{-b}
  Weet je zeker dat ik {$count} Tweets moet posten? Als ik eenmaal begonnen ben ben ik niet meer te stoppen!
  Als je het zeker weet, gebruik dit commando:
  `{-pr}tweet {$screenName} {$count} --force`

tweetNotAuthorized =
  {-b}Ik heb mijn best gedaan om een Tweet te posten van {$screenName}, helaas staat Twitter dat niet toe!{-b}
  Dit gebeurt meestal als dit account geblokkeerd is.

tweetUnknwnError =
  {-b}{$screenName} bestaat wel, maar er is iets mis met hun profiel.{-b}
  Ik kan de timeline van dit account niet binnenhalen ... Twitter heeft dit te zeggen:
  {$error}

noTweets = Het ziet er niet naar uit dat {$screenName} Tweets heeft...

noValidTweets =
  {-b}Dit account heeft geen Tweets die ik kan doorsturen.{-b}
  Probeer het nog een keer, het kan dat Twitter een foutje heeft gemaakt.

tweetGeneralError = 
  {-b}Er is iets mis gegaan met Tweets binnenhalen van {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Er is iets fout gegaan met het binnenhalen van deze Tweet: {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b} Er is iets misgegaan met de informatie binnenhalen voor {$namesCount ->
  [one] dit account
  *[other] deze accounts
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Je volgt nu {$addedObjectName}!{-b}
  Je kan dit altijd weer uitzetten met: `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Het kan tot 20 minuten duren voordat je tweets gaat ontvangen, maar daarna is het in real time!

  {$missedNames ->
    [0] {""}
    *[other] Het lijkt erop dat ik niet alle accounts die je wilt toevoegen kan vinden, controleer of je hun Twitter handle hebt gebruikt!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} en {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} updated!{-b}
  Je opties zijn opgeslagen. Dit werkt meteen. 

## !!leaveguild
noValidGid = Geen bestaande server gevonden.

guildNotFound = Ik kon de server niet vinden. {$guild}.

leaveSuccess = Server verlaten. {$name}

## !!stop
noSuchSubscription =
  {-b}Je volgt {$screenNames} op het moment niet.{-b}
  Gebruik `{-pr}list` om een lijst te zien van welke accounts je volgt!

stopSuccess =
  {-b}Je volgt niet langer {$screenNames}{-b}
  Vanaf nu krijg je geen Tweets meer binnen van dit account.

## !!stopchannel
stopChannelInDm =
  {-b}Er zijn geen kanalen in een prive gesprek, dit commando werkt dus alleen in servers.{-b}
  In een prive gesprek kan je simpelweg `{-pr}stopchannel` gebruiken om alles stop te zetten.

noSuchChannel =
  {-b}Ik kon dit kanaal niet in je server vinden: {$targetChannel}.{-b}
  Als je dit kanaal eerder al verwijderd hebt dan heb ik het al verlaten, maak je geen zorgen!

stopChannelSuccess =
  {-b}Je volgt niet langer {$subs ->
    [one] deze gebruiker
    *[other] {$subs} deze gebruiker
  }.{-b}
  Je krijgt van hen nu geen Tweets meer in {$channelName}.

## !!lang
noSuchLang =
  {-b}Ik ondersteun deze taal op dit moment niet.{-b}
  Je kan met `{-pr}lang list` een lijst zien van de talen die ik wel ondersteun.

langSuccess =
  {-b}Je taal is succesvol veranderd.{-b}
  Welkom in de wondere wereld van een Nederlandse QTweet!

## !!admin
adminInvalidId = I couldn't build a valid channel object with id: {$channelId}

adminInvalidTwitter = I'm not subscribed to any user called `@{$screenName}`

## General
invalidVerb = 
  {-b}Commando gefaald{-b}
  Fout werkwoord: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Ik kan {$count ->
    [1] geen Twitter account vinden met de naam
    *[other] geen van deze gebruikers vinden:
  } {$name}.{-b}
  Waarschijnlijk heb je zijn {$count ->
    [1] 'display name'
    *[other] 'display names'
  } in plaats van {$count -> 
    [1] zijn Twitter 'handle'
    *[other] hun Twitter 'handles'
  }.

tooManyUsersRequested =
  {-b}Te veel accounts in {-b}
  It seems I sent too many users to Twitter. This shouldn't happen, but in the meantime try requesting fewer users!

noSuchTwitterId =
  {-b}Dit ID bestaat niet{-b}
  Twitter zegt dat er geen Tweet bestaat met dit ID.

twitterUnknwnError =
  {-b}Er is iets fout gegaan met de interactie met Twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Commando voor mijn maker
# Generic error indicator
-notAuthorized = Niet toegestaan

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, alleen mijn eigenaar kan aankondigingen maken!
leaveForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, alleen mijn eigenaar kan mij uit een server forceren!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Dit commando werkt alleen in privé gesprekken.
adminForAdmin = 
  {-b}{-botOwnerCmd}{-b}
  Dit commando gebruikt data van andere servers, alleen mijn eigenaar mag het dus gebruiken!
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Alleen mods kunnen het volgen van een account stopzetten!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Om een Twitter account te volgen moet je de juist mod permissions hebben!
langForMods =
  {-b}{-notAuthorized}{-b}
  Alleen mods kunnen de taal aanpassen!

### Lists
genericEmptyList = Deze lijst is leeg, er is niets om te laten zien.

noUserSubscriptions = 
  {-b}Deze gebruiker volgt geen accounts{-b}
  Dit hoort niet te gebeuren :c

noSubscriptions = 
  {-b}Je volgt op dit moment niemand{-b}
  Gebruik `{-pr}start <{-screen-name-variable}>` om te beginnen!

# Flag formatting is on one line, in plain text
formatFlags = {$notext -> 
    *[0] Met
    [1] Zonder 
  } text posts, {$retweet ->
    *[0] Met
    [1] Zonder
  } retweets, {$noquote ->
    *[0] Met
    [1] Zonder
  } quotes, pings {$ping -> 
    *[0] aan
    [1] uit
  }

genericObjects = {$count} {$count -> 
    [one] object
    *[other] objecten
  }

subscriptions = {$count} {$count -> 
    [one] abonnement
    *[other] abonnementen
  }

languages = {$count} {$count -> 
    [one] taal
    *[other] talen
  }

### Posting errors
postPermissionError =
  {-b}Geen toestemming:{-b} Ik kon geen bericht in {$name} sturen.
  Als een mod mij de rolinstellingen {-b}Berichten verzenden{-b}, {-b}ingesloten links{-b} en {-b}bestanden bijvoegen{-b} geeft zou mij dat heel erg helpen.
  Als je wilt dat ik hier geen berichten meer stuur kunnen moderators  `{-pr}stopchannel {$id}` gebruiken.
  Als je denkt dat je alles op de juist manier doet maar het werkt nog steeds niet, bezoek dan mijn support server. De link kun je in mijn `{-pr}help` commando vinden.

### User Limit D:
userLimit =
  {-b}Ik heb mijn gebruikerslimiet bereikt!{-b} Je abbonement vraagt om accounts die niemand anders volgt en ik kan ze dus helaas niet toevoegen.

  {-b}Waarom gebeurd dit?{-b}
  Twitter limiteert helaas elke bot tot 5000 accounts. Ik kan hier niet omheen, als ik meer accounts probeer toe te voegen gaat alles voor iedereen kapot.

  {-b}Ben je bezig om dit op te lossen?{-b}
  Ik ben heel hard aan het werk geweest om dit probleem op te lossen, Ik wil graag dat iedereen zijn Tweets kan blijven ontvangen. Helaas ben ik nog niet op een goede oplossing gekomen.
  Als je een idee voor een oplossing hebt kan je deze hier naar mij sturen: https://github.com/atomheartother/QTweet/issues/32

  {-b}Kan ik helpen?{-b}
  Als je de posts hierboven doorgelezen hebt zul je gezien hebben dat bijna alle oplossingen helaas geld gaan kosten. you'll see a lot of options will cost me money. Als je wilt helpen om QTweet voor iedereen aan de gang te houden kan je doneren op mijn Patreon! Alle beetjes helpen enorm: https://www.patreon.com/atomheartother

  {-b}Hoe kan ik er voor nu voor zorgen dat ik wel de Tweets ontvang die ik wil?{-b}
  Als je echt Tweets van deze accounts in je server wilt ontvangen zijn er een aantal opties:
  - {-b}Host QTweet zelf:{-b} Ik kan dit zeer zeker aan raden, QTweet is gratis beschikbaar en volledig open source, je kan haar op elke computer of server draaien. Meer hierover is te vinden in de `!!help` commando, ook kan je contact opnemen met mijn maker.
  - {-b}Verwijder een aantal van de accounts die je al volgt.{-b} Hiermee kan je ruimte vrijmaken om onder de limiet te komen. Let op: als een andere server dit account ook al volgt helpt dit helaas niet :c
  - {-b}Zoek een alternatief.{-b}: Helaas, ik kan er niet omheen, als bovenstaande opties niet voor je werken ben ik bang dat ik alleen dit nog kan aanraden.

### Credit
languageCredit = Nederlandse vertaling is gemaakt door: `Tim Seip#6787`