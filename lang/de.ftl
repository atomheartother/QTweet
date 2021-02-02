### Small words
id = ID
type = Typ
dm = dm
serv = Server

### Help messages
# This is in the help message header
helpHeader = {-bot-name} ist hier!

# The main help message body, followed by usage
helpIntro =
  Hallo, ich bin { -bot-name }, Ich bin ein sehr simpler Bot, der Twitter Nachrichten auf Discord anzeigt!
  {-b}Du solltest meine [komplette Dokumentation]({ -docs-url }) lesen{-b}
  {-b}Möchtest du mich auf deinen Server einladen?{-b} [hier klicken]({ -invite-url })!
  {-b}Probleme, Fragen?{-b} [Wir haben einen support Server!]({ -support-server })
  {-b}Du möchtest QTweet unterstützen?{-b} [Mach eine Spende bei Patreon!]({ -patreon-link })
  
  Hier ist eine kurze Liste von Befehlen, mit denen du beginnen kannst:

# Footer giving credit to the artist
helpFooter = Profilbild von {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Hallo, ich bin {-bot-name}, danke dass du mich auf deinen Server eingeladen hast!
      {-b}Um zu beginnen:{-b} `{-pr}help` für Befehle und nütliche Links!
      {-b}Wenn ich nützlich für deinen Server bin{-b}, würde es mich freuen wenn du für mich abstimmst auf {-profile-url}
      
      Wenn du einen meiner Befehle ausführst, stimmst du zu dass {-b}alle Inhalte, die über mich auf deinem Server oder über DMs gepostet werden, in deiner eigenen Verantwortung liegen{-b}. Weitere Informationen findest du in meiner Dokumentation..

### Command usage

# The word "usage"
-usage = Verwendung
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_screen_name

## Usage for every command
usage-tweet = 
  Post the latest tweet(s) from the given user.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  Abonniere einen Twitter-Benutzer und schicke seine Tweets in Echtzeit.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Unterstützt mehrere Benutzer, Retweets, Herausfiltern von Textbeiträgen und mehr! Schau dir die Dokumentation an!

usage-stop = 
  Deabonieren vom angegebenen Twitter-Benutzer.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Genau wie {-pr}stop wirkt aber für den ganzen Kanal.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Zeigt eine Liste der Abonnements dieses Kanals.

usage-lang = 
  Liste der verfügbaren Sprachen auf oder ändere die Sprache.
  Lese die Dokumentation, wenn du mir helfen möchten, mich in eine Sprache zu übersetzen!
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

usage-qtprefix =
  Ändern Sie das Präfix, um mit mir zu interagieren.
  Du musst ein **Server** Moderator sein, um dies zu benutzen!
  {-b}{-usage}{-b}: `{-pr}qtprefix <new_prefix>`

usage-tweetid =
  Veröffentliche einen Tweet mit der angegebenen ID.
  {-b}{-usage}{-b}: `{-pr}tweetid <tweet_id>`


### Command feedback
-error-apology = Ich bin dran, entschuldigung!
## !!tweet
countIsNaN =
  {-b}Bitte gib eine Zahl von Tweets an, die ich holen soll!{-b}
  Hey, {$count} ist keine gültige Zahl! >:c

tweetCountLimited = 
  {-b}Begrenzt auf {$maxCount} Tweets{-b}
  Du bist kein Moderator, daher muss ich die Anzahl der Tweets limitiern. Hier sind die letzten {$maxCount} Tweets!

tweetCountUnderOne =
  {-b}Du hast mich gebeten, {$ count} Tweets zu posten, deshalb poste ich keine!{-b}
  Netter Versuch~

tweetCountHighConfirm =
  {-b}Du fragst nach einer Menge Tweets{-b}
  Bist du dir sicher, dass ich {$count} Tweets senden soll? Wenn ich einmal angefangen habe, kannst du mich nicht mehr aufhalten!
  Wenn du dir sicher bist, dass ich das tun soll, benutze:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Ich habe versucht einen Tweet von {$screenName} zu erhalten, aber Twitter sagt mir, ich wäre nicht authorisiert.{-b}
  Dies wird normalerweise durch ein gesperrtes Konto verursacht.

tweetUnknwnError =
  {-b}{$screenName} existiert, aber irgend etwas scheint bei dem Profil nicht zu stimmen{-b}
  ich kann die Zeitliste nicht erreichen... Twitter sagt mir folgendes:
  {$error}

noTweets = Sieht nicht so aus, als ob {$screenName} Tweets hat...

noValidTweets =
  {-b}Dieser benutzer hat keine gültigen Tweets{-b}
  Vielleicht möchtest du es noch einmal versuchen, vielleicht hat Twitter es vermasselt?

tweetGeneralError = 
  {-b}Beim Abrufen von Tweets von {$ screenName} ist ein Fehler aufgetreten.{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Beim abrufen vom Tweet {$id} ist etwas schief gelaufen!{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Etwas ist fehlgeschlagen beim abrufen {$namesCount ->
  [one] dieses Kontos
  *[other] dieser Konten
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Du hast jetzt {$ addedObjectName} abonniert!{-b}
  Denk daran, dass du das jeder Zeit beenden kannst mit `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Es kann bis zu 20 Minuten dauern, bis Tweets abgerufen werden. Sobald es angefangen hat, werden die Tweets in Echtzeit abgerufen!

  {$missedNames ->
    [0] {""}
    *[other] Es scheint so, also ob ich einge der Benutzer nicht finden kann! Bitte stelle sicher, dass du die Twitter Namen verwendest, nicht die Anzeige Namen!
  }

# This is how we display multiple names.
# If we only have one, we display it, if we have multiple we display them, then add the last one.
formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} und {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} aktualisiert!{-b}
  Deine neuen Flaggen wurden registriert. Die Änderungen sollten sofort erfolgen.

## !!leaveguild
noValidGid = Ungültige Gilden ID

guildNotFound = Ich konnte die Gilde {$guild} nicht finden.

## !!stop
noSuchSubscription =
  {-b}Es existiert kein Abo für {$screenNames}{-b}
  Verwende `{-pr}list` um eine Liste deiner Abonnements zu sehen!

stopSuccess =
  {-b}Ich habe dich abgemeldet von {$screenNames}{-b}
  Du solltest nun keine Tweets mehr von {$screenNames} erhalten.

## !!stopchannel
stopChannelInDm =
  {-b}Verwende diesen Befehl auf dem gewünschten ziel Server{-b}
  Diesen Befehl musst du nicht als DM schicken. Wenn du alle DM Abonnements beenden möchtest, verwende `{-pr}stopchannel`.

noSuchChannel =
  {-b}Ich konnte den Kanal {$targetChannel} in deinem Server nicht finden.{-b}
  Wenn du ihn gelöscht hast, hab ich ihn schon verlassen, keine Sorge!

stopChannelSuccess =
  {-b}Ich habe dich abgemeldet von {$subs ->
    [one] einem Benutzer
    *[other] {$subs} Benutzern
  }.{-b}
  Du solltest nun keine Tweets mehr in `{$channelName}` erhalten.

## !!lang
noSuchLang =
  {-b}Ich unterstütze diese Sprache nicht!{-b}
  Du kannst `{-pr}lang list` verwednen um eine Liste der verfügbaren Sprachen zu erhalten.

langSuccess =
  {-b}Sprache erfolgreich geändert{-b}
  Willkommen bei der Sprache der Dichter und Denker!

prefixSuccess =
  {-b}Präfix erfolgreich geändert{-b}
  Du musst nun {$prefix} verwenden, damit ich mich angesprochen fühle!

## General
invalidVerb = 
  {-b}Befehl fehlgeschlagen{-b}
  Ungültiges Verb: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Ich kann keinen {$count ->
    [1] Twitter Benutzer mit dem Namen finden
    *[other] dieser Benutzer finden:
  } {$name}.{-b}
  Du hast vermutlich versucht ihren Anzeigenamen zu verwenden anstatt ihrem Twitternamen

tooManyUsersRequested =
  {-b}Zu viele Benutzer angefordert{-b}
  Es sieht so aus, als hätte ich zu viele Twitter Benutzer angefordert. Das sollte nicht passieren, aber in der Zwischenzeit könntest du versuchen weniger Benutzer abzufragen!

noSuchTwitterId =
  {-b}Ungültige ID{-b}
  Twitter sagt es gibt keinen Tweet mit dieser ID!

twitterUnknwnError =
  {-b}Bei der Interaktion mit Twitter ist ein Fehler aufgetreten!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Bot Besitzer Befehl
# Generic error indicator
-notAuthorized = Nicht autorisiert

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, nur Besitzer dürfen Ankündigungen machen!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Dieser Befehl ist nur in DMs erlaubt.
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Nur Moderatoren können einen Twitter-Account de-abonnieren!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Um einen Twitter-Account zu abonnieren, müssen Sie Moderator sein oder die richtige Rolle haben!
langForMods =
  {-b}{-notAuthorized}{-b}
  Nur Server weite Moderatoren können sprachbefehle ausführen!
prefixForMods = 
  {-b}{-notAuthorized}{-b}
  Nur Server weite Moderatoren können den Präfix ändern!
### Lists
genericEmptyList = Die Liste ist leer, es gibt nichts anzuzeigen.

noUserSubscriptions = 
  {-b}Dieser Benutzer hat keine Abonnements{-b}
  Das sollte nicht vorkommen :c

noSubscriptions = 
  {-b}Du hast niemanden abonniert{-b}
  Verwende `{-pr}start <{-screen-name-variable}>` um anzufangen!

# Flag formatting is on one line, in plain text
formatFlags = With {$notext -> 
    *[0] Text Nachrichten
    [1] keine Text Nachrichten
  }, {$retweet ->
    *[0] keine Retweets
    [1] Retweets
  }, {$noquote ->
    *[0] Zitate
    [1] keine Zitate
  }, pings {$ping -> 
    *[0] aus
    [1] an
  } und {$replies -> 
    *[0] keine Antworten
    [1] Antworten
  } wurden gesendet.

genericObjects = {$count} {$count -> 
    [one] Objekt
    *[other] Objekte
  }

subscriptions = {$count} {$count -> 
    [one] Abonnement
    *[other] Abonnements
  }

languages = {$count} {$count -> 
    [one] Sprache
    *[other] Sprachen
  }

### Posting errors
postPermissionError =
  {-b}Missing Permissions:{-b} I couldn't send a message in {$name}.
  If a mod could give me the {-b}Send Messages{-b}, {-b}Send Embeds{-b} and {-b}Attach Files{-b} permissions there that would be nice.
  If you'd like me to stop trying to send messages there, moderators can use `{-pr}stopchannel {$id}`.
  If you think you've done everything right but keep getting this message, join our support server, it's linked in my `{-pr}help` message.

### User Limit D:
userLimit =
  {-b}I've hit my user limit!{-b} Your subscription request contained accounts no one else is subscribed to, so I had to drop them.

  {-b}Why did you do this?{-b}
  Twitter currently limits every app to 5 000 subscriptions. If you're reading this I have reached that limit, and I have no choice - if I ask for more users then everything will break for everyone.

  {-b}What are you doing to fix this?{-b}
  I've been working really hard to try and find options to get out of this situation, and it's been very stressful for me, because I really want everyone to get their tweets. However so far no option seems perfect.
  You can find a thread on the topic here if you'd like to propose any solutions: https://github.com/atomheartother/QTweet/issues/32

  {-b}Can I help?{-b}
  If you read the thread I posted above, you'll see a lot of options will cost me money. If you'd like to help and make it possible for QTweet to function better for everyone, you can support QTweet's development on Patreon - every little bit helps: https://www.patreon.com/atomheartother

  {-b}How do I get my tweets in the meantime?{-b}
  You have a few options if you really want these accounts posted to your server:
  - {-b}Host your own version of QTweet{-b}: I would really recommend doing this, QTweet is free and open source, and you can run her from any computer or server. You can read more in the `!!help` message and contact my creator if you need help.
  - {-b}Remove some of your subscriptions{-b} if you have any, to free up some space - note that if another server is subscribed to that account this will not work unfortunately.
  - {-b}Find an alternative to QTweet{-b}: Yup, that's it, if those options don't work for you I'm afraid I can't do anything else for you!

### Credit
languageCredit = German, made by `Samsa#4879` aka framerunner
