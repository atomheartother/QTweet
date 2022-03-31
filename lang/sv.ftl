### Small words
id = ID
type = Typ
dm = dm
serv = server

### Help messages
# The main help message body, followed by usage
helpHeader = {-bot-name} är här!

# The main help message body, followed by usage
helpIntro =
  Hej, jag är { -bot-name }, jag är en väldigt simpel bot som vidarebefordrar tweets till Discord!
  {-b}Du borde läsa min [kompletta dokumentation]({ -docs-url }){-b}
  {-b}Vill du bjuda in mig till din server?{-b} [Klicka Här]({ -invite-url })!
  {-b}Problem, frågor?{-b} [Vi har en hjälp server!]({ -support-server })
  {-b}Vill du hjälpa QTweet?{-b} [Donera till vårt Patreon!]({ -patreon-link })
  
  Här är en kort lista med kommandon till att börja med:

# Footer giving credit to the artist
helpFooter = Profilbild gjord av {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Hej, jag är {-bot-name}, tack för att du bjöd in mig till din server!
      {-b}För att börja:{-b} `{-pr}help` för kommandon och användbara länkar!
      {-b}Om jag är användbar för din server{-b} skulle det betyda mycket om du ville rösta på mig på{-profile-url}
      
      Genom att använda mina kommandon, går du med på att {-b}allt material skickat till din server eller till dina direkta meddelanden genom mig är ditt eget ansvar{-b}, se min dokumentation för mer information.

### Command usage

# The word "usage"
-usage = Användning
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_screen_name

## Usage for every command
usage-tweet = 
  Skicka de/den senaste tweetsen/tweeten från en angiven användare.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  Följ ett twitter-konto och skicka deras tweets i realtid.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Stöder flera användare, retweets, filtrerad text, inlägg och mer! Kolla in dokumentationen!

usage-stop = 
  Avbryt prenumerationen från den givna användaren.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Exact som {-pr}stop men agerar på hela kanalen.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Printa en lista med denna kanalens prenumerationer.

usage-lang = 
  Lista tillgängliga språk eller ändra språket.
  Läs dokumentationen om du vill hjälpa till att översätta mig till ditt språk!
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

usage-qtprefix =
  Byt prefixen som används för att interagera med mig.
  Du måste vara en **serveromfattande** moderator för att göra detta!
  {-b}{-usage}{-b}: `{-pr}qtprefix <new_prefix>`

### Command feedback
-error-apology = I'm on it, sorry for the trouble!
## !!tweet
countIsNaN =
  {-b}Jag behöver ett antal tweets att hämta!{-b}
  Hey, {$count} är inte ett number! >:c

tweetCountLimited = 
  {-b}Limited to {$maxCount} tweets{-b}
  Du är inte en moderator så jag måste begränsa dig - här är de senaste {$maxCount} tweetsen!

tweetCountUnderOne =
  {-b}Du bad mig skicka {$count} tweets, så jag kommer inte skicka några.{-b}
  Bra försök~

tweetCountHighConfirm =
  {-b}Du frågar efter väldigt många tweets{-b}
  Är du säker på att du vill att jag ska skicka {$count} tweets? När jag har börjat, kommer du inte att kunna stoppa mig!
  If you're sure you want me to do it, run:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Jag försökte hämta {$screenName} tweets från men Twitter säger att hen är oauktoriserad.{-b}
  Det här är ofta orsakat av ett blockat konto.

tweetUnknwnError =
  {-b}{$screenName} existerar inte men något verkar fel med deras profil{-b}
  Jag kan inte hämta deras tidslinje... Twitter säger:
  {$error}

noTweets = Det verkar som om {$screenName} inte har några tweets...

noValidTweets =
  {-b}Den här användaren verkar inte ha några giltiga tweets{-b}
  Du kanske vill testa igen, kanske Twitter trasslade till det?

tweetGeneralError = 
  {-b}Något gick fel under hämtningen av tweets från {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Något gick fel under hämtningen av tweet {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Något gick fel under hämtningen av info från {$namesCount ->
  [one] det här kontot
  *[other] these accounts
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Du följer nu {$addedObjectName}!{-b}
  Kom ihåg att du alltid kan stoppa mig med `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Det kan ta upp till 20 minuter att börja få tweets från dem, men när de börjar, kommer de vara i realtid!

  {$missedNames ->
    [0] {""}
    *[other] Det verkar också som om jag misslyckades att hitta några av de användare du specificerade, kolla att du använde deras screen name/skärmnamn!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} och {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} updated!{-b}
  Dina nya flaggor har registrerats. Ändringarna borde vara omedelbara.

## !!leaveguild
noValidGid = Inget giltigt gille ID försett.

guildNotFound = Jag kunde inte hitta gille {$guild}.

## !!stop
noSuchSubscription =
  {-b}Följer inte {$screenNames}{-b}
  Använd `{-pr}list` för en lista med prenumerationer!

stopSuccess =
  {-b}Jag har avbrutit prenumerationen från {$screenNames}{-b}
  Du borde inte få några tweets från dem.

## !!stopchannel
stopChannelInDm =
  {-b}Använd det här kommandot i servern du vill målsätta{-b}
  Du behöver inte använda argument i direkta meddelanden. Om du vill stoppa alla DM prenumerationer kör bara kommandot `{-pr}stopchannel`.

noSuchChannel =
  {-b}Jag kunde inte hitta kanalen {$targetChannel} i din server.{-b}
  Om du har tagit bort den, har jag antagligen redan lämnat den, oroa dig inte!

stopChannelSuccess =
  {-b}Jag har avprenumererat dig från {$subs ->
    [one] en användare
    *[other] {$subs} användare
  }.{-b}
  Du borde inte få några tweets i `{$channelName}`.

## !!lang
noSuchLang =
  {-b}Det här språket är inte tillgängligt{-b}
  Du kan köra kommandot `{-pr}lang list` för att få en lista med alla tillgängliga språk

langSuccess =
  {-b}Ändringen av språk lyckades{-b}
  Välkommen till den magiska världen av det svenska språket!

prefixSuccess =
  {-b}Ändringen av prefixen lyckades{-b}
  Du måste nu använda {$prefix} för att jag ska förstå dig!

## General
invalidVerb = 
  {-b}Command failed{-b}
  Invalid verb: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Jag kunde inte hitta {$count ->
    [1] en twitter användare som heter
    *[other] någon av dessa användare:
  } {$name}.{-b}
  Du har antagligen försökt använda deras display {$count ->
    [1] namn
    *[other] namn
  } och inte deras twitter {$count -> 
    [1] användarnamn
    *[other] användarnamn
  }.

tooManyUsersRequested =
  {-b}För många användare begärda{-b}
  Det verkar som om jag begärde för många användare till twitter. Det här borde inte hända, men under tiden kan du försöka begära färre användare!

noSuchTwitterId =
  {-b}No such ID{-b}
  Twitter säger att det inte finns någon tweet med det id!

twitterUnknwnError =
  {-b}Något gick fel under interageringen med twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Bot Ägare Kommando
# Generic error indicator
-notAuthorized = Inte Auktoriserad

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Ledsen, endast min ägare kan skicka meddelanden!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Det här kommandot är bara tillåtet i direkta meddelanden.
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Endast moderatorer kan avprenumerera från en twitter användare!
startForMods = 
  {-b}{-notAuthorized}{-b}
  För att prenumerera till ett Twitter konto måste du vara en moderator eller ha rätt roll!
langForMods =
  {-b}{-notAuthorized}{-b}
  Endast server-nivå moderatorer kan utföra språkkommandon!
prefixForMods = 
  {-b}{-notAuthorized}{-b}
  Endast server-nivå moderatorer kan ändra prefixen!
### Lists
genericEmptyList = Listan är tom, ingenting att visa.

noUserSubscriptions = 
  {-b}Den här användaren har inga prenumerationer{-b}
  Det här borde inte hända :c

noSubscriptions = 
  {-b}Du följer inte nån{-b}
  Använd `{-pr}start <{-screen-name-variable}>` för att starta!

# Flag formatting is on one line, in plain text
formatFlags = Med {$notext -> 
    *[0] text inlägg
    [1] inga textinlägg
  }, {$retweet ->
    *[0] inga retweets
    [1] retweets
  }, {$noquote ->
    *[0] citat
    [1] inga citat
  }.

genericObjects = {$count} {$count -> 
    [one] objekt
    *[other] objekt
  }

subscriptions = {$count} {$count -> 
    [one] prenumeration
    *[other] prenumerationer
  }

languages = {$count} {$count -> 
    [one] språk
    *[other] språk
  }

### Posting errors
postPermissionError =
  {-b}Missing Permissions:{-b} Jag kunde inte skicka ett meddelande i {$name}.
  Om en moderator gav mig {-b}Send Messages{-b}, {-b}Send Embeds{-b} and {-b}Attach Files{-b} behörigheter där skulle det vara trevligt.
  Om du vill att jag ska sluta skicka meddelanden där, så kan moderatorerna använda `{-pr}stopchannel {$id}`.
  Om du tror att du har gjort allting rätt men fortfarande får det här meddelandet, gå med i vår hjälp server, länken finns i mitt `{-pr}help` meddelande.

### User Limit D:
userLimit =
  {-b}Jag har nått min användargräns!{-b} Din prenumerationsförfrågan innehöll ingen annan följer, så jag var tvungen att släppa dem.

  {-b}Varför gjorde du det här?{-b}
  Twitter begränsar applikationer till 5 000 prenumerationer. Om du läser det här har jag nått den gränsen, och har inget val - om jag frågar efter fler användare kommer allt att förstöras för alla.

  {-b}Vad gör du för att fixa det här?{-b}
  Jag har jobbat riktigt hårt för att försöka hitta alternativ för att hitta ett sätt att undvika det här problemet, och det har varit väldigt stressigt för mig, då jag verkligen vill att alla ska kunna få sina tweets. Tyvärr så har inga alternativ funkat än så länge.
  Du kan hitta en tråd om det här ämnet här om du skulle vilja framföra dina lösningar: https://github.com/atomheartother/QTweet/issues/32

  {-b}Kan jag hjälpa till?{-b}
  Om du läser tråden jag skickade ovan, så ser du att många av de lösningar vi kommit fram till kostar pengar. Om du skulle vilja vara med och bidra till att QTweet funkar bättre för alla, kan du hjälpa QTweet's utveckling på Patreon - varje liten bit hjälps: https://www.patreon.com/atomheartother

  {-b}Hur kan jag hämta tweets under tiden?{-b}
  Du har några alternativ om du verkligen vill att dina tweets skickade till din server:
  - {-b}Håll i din egen version av QTweet{-b}: Jag skulle verkligen rekommendera att du gör detta, QTweet är gratis och open source, och du kan köra henne från vilken dator eller server som helst. Du kan läsa mer i `!!help` meddelandet och kontakta min skapare om du behöver hjälp.
  - {-b}Ta bort några av dina prenumerationer{-b} om du har några, för att frigöra lite utrymme - notera att om en annan server prenumererar till det kontot kommer inte det att fungera tyvärr.
  - {-b}Hitta ett alternativ till QTweet{-b}: Ja, det är allt, om de här alternativen inte funkar för dig är jag rädd att jag inte kan göra något annat för dig!

### Credit
languageCredit = Svenska, översatt av `PolyBit#1610`
