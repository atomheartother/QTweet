### Small words
id = ID
type = Typ
dm = DM
serv = Server

### Help messages
# This is in the help message header
helpHeader = {-bot-name} ist hier!

# The main help message body, followed by usage
helpIntro =
  Hallo, ich bin { -bot-name }, Ich bin ein sehr einfacher Bot, der Twitter Nachrichten auf Discord anzeigt!
  {-b}Du solltest meine [komplette Dokumentation]({ -docs-url }) lesen.{-b}
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
  Sende die neusten Tweets, des angegebenen Benutzers.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  Abonniere einen Twitter-Benutzer und schicke seine Tweets in Echtzeit.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Unterstützt mehrere Benutzer, Retweets, Herausfiltern von Textbeiträgen und mehr!
  Schau dir die Dokumentation an!

usage-stop = 
  Deabonieren vom angegebenen Twitter-Benutzer.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Genau wie {-pr}stop wirkt aber für den ganzen Kanal.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Zeigt eine Liste der Abonnements dieses Kanals.

usage-lang = 
  Zeige eine Liste der verfügbaren Sprachen oder ändere die Sprache.
  Lese die Dokumentation, wenn du mir helfen möchtest, mich in eine andere Sprache zu übersetzen!
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

usage-qtprefix =
  Ändere das Präfix, um mit mir zu interagieren.
  Du musst ein {-b}Server{-b} Moderator sein, um dies zu benutzen!
  {-b}{-usage}{-b}: `{-pr}qtprefix <new_prefix>`

usage-tweetid =
  Sende einen Tweet mit der angegebenen ID.
  {-b}{-usage}{-b}: `{-pr}tweetid <tweet_id>`


### Command feedback
-error-apology = Entschuldige die Unanhemlichkeit!
## !!tweet
countIsNaN =
  {-b}Bitte gib eine Zahl von Tweets an, die ich holen soll!{-b}
  Hey, {$count} ist keine gültige Zahl! >:c

tweetCountLimited = 
  {-b}Begrenzt auf {$maxCount} Tweets{-b}
  Du bist kein Moderator, daher muss ich die Anzahl der Tweets limitiern. Hier sind die letzten {$maxCount} Tweets!

tweetCountUnderOne =
  {-b}Du hast mich gebeten, {$count} Tweets zu posten, deshalb poste ich keine!{-b}
  Netter Versuch~

tweetCountHighConfirm =
  {-b}Du fragst nach einer großen Menge Tweets{-b}
  Bist du dir sicher, dass ich {$count} Tweets senden soll?
  Wenn ich einmal angefangen habe, kannst du mich nicht mehr aufhalten!
  Wenn du dir sicher bist, dass ich das tun soll, benutze:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Ich habe versucht einen Tweet von {$screenName} zu erhalten, aber Twitter sagt mir, ich wäre nicht authorisiert.{-b}
  Dies wird normalerweise durch ein gesperrtes Konto verursacht.

tweetUnknwnError =
  {-b}{$screenName} existiert, aber irgend etwas scheint bei dem Profil nicht zu stimmen{-b}
  ich kann die Timeline nicht erreichen... Twitter sagt mir folgendes:
  {$error}

noTweets = Sieht nicht so aus, als ob {$screenName} Tweets hat...

noValidTweets =
  {-b}Dieser benutzer hat keine gültigen Tweets{-b}
  Vielleicht möchtest du es noch einmal versuchen, vielleicht hat Twitter es vermasselt?

tweetGeneralError = 
  {-b}Beim Abrufen von Tweets von {$screenName} ist ein Fehler aufgetreten.{-b}
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
  {-b}Du hast jetzt {$addedObjectName} abonniert!{-b}
  Denk daran, dass du das jeder Zeit beenden kannst mit `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Es kann bis zu 20 Minuten dauern, bis Tweets abgerufen werden. Sobald es einmal läuft, werden die Tweets in Echtzeit abgerufen!

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
    [1] Twitter Benutzer finden mit dem Namen
    *[other] dieser Twitter Benutzer finden:
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
  Nur Moderatoren können einen Twitter-Account deabonnieren!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Um einen Twitter-Account zu abonnieren, müssen Sie Moderator sein oder die richtige Rolle haben!
langForMods =
  {-b}{-notAuthorized}{-b}
  Nur Server Moderatoren können Befehle bezüglich der Sprache ausführen!
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
formatFlags = Mit {$notext -> 
    *[0] Text Nachrichten
    [1] keine Text Nachrichten
  }, {$retweet ->
    *[0] keine Retweets
    [1] Retweets
  }, {$noquote ->
    *[0] Zitate
    [1] keine Zitate
  }, Pings {$ping -> 
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
  {-b}Fehlende Berechtigungen:{-b} Ich konnte keine Nachrichten senden in {$name}.
  Wenn mir ein Moderator die Erlaubnis geben würde damit ich dort {-b}Nachriten schicken{-b}, {-b}Send Embeds{-b} und {-b}Datein anhängen{-b} wäre das sehr nett.
  Wenn du möchtest, dass ich nicht mehr versuche, Nachrichten dorthin zu senden, können Moderatoren `{-pr}stopchannel {$id}` verwenden.
  Wenn du glaubst alles richtig gemacht haben, diese Nachricht aber weiterhin erhälst, trete unserem Support-Server bei. Dieser ist in meiner Hilfe-Nachricht "{-pr}" verlinkt.

### User Limit D:
userLimit =
  {-b}Ich habe mein Benutzerlimit erreicht!{-b} Deine Abonnementanfrage enthielt Konten, die niemand sonst abonniert hat, daher musste ich sie verwerfen.

  {-b}Warum hast du das gemacht?{-b}
  Twitter beschränkt derzeit jede App auf 5.000 Abonnements. Wenn du das hier lesen kannst, habe ich dieses Limit erreicht und ich habe keine Wahl - wenn ich nach mehr Benutzern frage, wird alles für alle kaputt gehen.

  {-b}Was tust du, um das zu beheben?{-b}
  Ich habe wirklich hart gearbeitet, um Optionen zu finden, um aus dieser Situation herauszukommen, und es war sehr stressig für mich, weil ich wirklich möchte, dass jeder seine Tweets bekommt. Bisher scheint jedoch keine Option perfekt zu sein.
  Einen Thread zum Thema findest du hier, wenn du Lösungen vorschlagen möchten: https://github.com/atomheartother/QTweet/issues/32

  {-b}Kann ich helfen?{-b}
  Wenn du den Thread lesen, den ich oben gepostet habe, wirst du feststellen, dass viele Optionen mich Geld kosten. Wenn du helfen möchtest und es QTweet ermöglichen möchtest, für alle besser zu funktionieren, kannst du die Entwicklung von QTweet auf Patreon unterstützen - jedes kleine bisschen hilft: https://www.patreon.com/atomheartother

  {-b}Wie erhalte ich Tweets in der Zwischenzeit?{-b}
  Du hast einige Optionen, wenn du wirklich möchtest, dass diese Konten auf deinem Server gesendet werden:
  - {-b}Host deine eigene Version von QTweet{-b}: Ich würde dies wirklich empfehlen, QTweet ist kostenlos und Open Source, und du kannst sie von jedem Computer oder Server aus ausführen. Du kannst mehr in der Nachricht "{-pr}help" lesen und meine Schöpferin kontaktieren, wenn du Hilfe benötigst.
  - {-b}Entferne ein Paar deiner Abonnements {-b}, falls vorhanden, um Speicherplatz freizugeben. Beachte dass dies leider nicht funktioniert, wenn ein anderer Server das selbe Twitter-Konto abonniert hat.
  - {-b}Finde eine Alternative zu QTweet{-b}: Jap, das war's. Wenn diese Optionen für dich nicht funktionieren, dann kann ich leider nicht's mehr für dich tun!

### Credit
languageCredit = Deutsch, übersetzt von `Samsa#4879`
