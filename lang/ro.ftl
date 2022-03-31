### Small words
id = ID
type = Scrie
dm = dm
serv = server

### Help messages
# This is in the help message header
helpHeader = {-bot-name} este aici!

# The main help message body, followed by usage
helpIntro =
  Salutări, mă numesc { -bot-name }, sunt un bot simplu făcut pentru a posta tweet-urile alese de tine pe Discord!
  {-b}Pentru mai multe informații, ai putea să-mi citești [documentarul personal]({ -docs-url }){-b}
  {-b}Ți-ar plăcea să mă inviți pe server-ul tău?{-b} [Click aici! :D]({ -invite-url })!
  {-b}Probleme sau întrebări?{-b} [Avem un server pentru suport!]({ -support-server })
  Aici este o listă scurtă de comenzi pe care le poți folosi pentru început:

# Footer giving credit to the artist
helpFooter = Poza de profil este realizată de {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Bună, eu sunt {-bot-name}, îți mulțumesc pentru că m-ai invitat pe server-ul tău!
      {-b}Pentru început folosește comanda:{-b} `{-pr}help` pentru lista de comenzi și link-uri folositoare!
      {-b}Dacă mă fac de folos server-ului tău{-b}, te rog să-mi dai un vot pe {-profile-url}
      
      Prin utilizarea comenzilor mele, ești de acod și complet responsabil cu {-b}orice tip de conținut postat pe server-ul tău sau in DMs prin intermediul meu{-b}, citește-mi documentarul pentru mai multe informații.

### Command usage

# The word "usage"
-usage = Folosește
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_nume_afișat

## Usage for every command
usage-tweet = 
  Postează cele mai recente tweet-uri de la un utilizator specificat.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=cardinalul]`

usage-start =
  Abonează-te la un utilizator de twitter și voi posta toate tweet-urile lui în timp real.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [alți utilizatori]`
  Funcționează cu utilizatori multipli, retweet-uri, filtrarea mesajelor text și chiar mai multe! Verifică documentarul!`

usage-stop = 
  Dezabonează-te de la un utilizator specificat.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Asemenea comenzii {-pr}stop , dar acționează pe întregul canal.
  {-b}{-usage}{-b}: `{-pr}stopchannel [ID-ul canalului]`

usage-list = Afișarea listei cu abonamentele acestui canal.

usage-lang = {-usage}: `{-pr}lang [list|set <limba>]`
usage-lang-set = {-usage}: `{-pr}lang set <limba>`

### Command feedback
-error-apology = O voi rezolva curând!
## !!tweet
countIsNaN =
  {-b}Am nevoie de un număr de tweet-uri pentru a le obține!{-b}
  Alo, {$count} nu este un număr!

tweetCountLimited = 
  {-b}Limita este de {$maxCount} tweet-uri{-b}
  Nu ești un mod, așa că trebuie să te limitez - acestea sunt ultimele {$maxCount} tweet-uri!

tweetCountUnderOne =
  {-b}Mi-ai cerut să postez {$count} tweet-uri, așa că nu voi posta niciunul{-b}
  Frumoasă încercare ;D

tweetCountHighConfirm =
  {-b}Îmi ceri să postez foarte multe tweet-uri!{-b}
  Ești sigur că vrei să postez {$count} tweet-uri? Odată ce încep, nu mă vei putea opri până nu termin!
  Dacă ești sigur ca vrei sa postez atâtea tweet-uri, rulează comanda:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}Am încercat să iau un tweet de la {$screenName} , dar Twitter îmi refuză această acțiune.{-b}
  Această problemă este cauzată, de obicei, de un cont blocat.

tweetUnknwnError =
  {-b}{$screenName} există, dar ceva pare să nu fie în regulă cu profilul utilizatorului respectiv!{-b}
  Nu pot să le obțin cronologia... Twitter avea asta de spus:
  {$error}

noTweets = Se pare că {$screenName} nu are niciun tweet...

noValidTweets =
  {-b}Acest utilizator nu pare să aibă vreun tweet valid.{-b}
  S-ar putea să vrei să încerci din nou, poate Twitter a încurcat treaba?

tweetGeneralError = 
  {-b}Ceva nu a mers bine în încercarea de a posta tweet-uri de la {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Ceva nu a mers bine obținând tweet-ul {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Ceva nu a mers bine obținând informații de la {$namesCount ->
  [one] acest cont
  *[other] aceste conturi
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Acum ești abonat la {$addedObjectName}!{-b}
  Amintește-ți că poți opri abonamentul folosind comanda: `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Poate să dureze până la 20 de minute pentru a începe postarea tweet-urilor lor recente, dar odată ce voi începe treaba, le voi posta în timp real!

  {$missedNames ->
    [0] {""}
    *[other] De asemenea, nu am putut găsi o parte din utilizatorii specificați, asigură-te că le-ai folosit corect numele de afișare!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} și {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} actualizat!{-b}
  Noii tăi parametrii au fost înregistrați. Schimbările ar trebui să fie instante.

## !!leaveguild
noValidGid = ID-ul guild-ului nu este valid!

guildNotFound = Nu am putut găsi guild-ul {$guild}.

## !!stop
noSuchSubscription =
  {-b}Nu există un abonament la {$screenNames}{-b}
  Folosește `{-pr}list` pentru a vedea lista completă a abonamentelor!

stopSuccess =
  {-b}Te-am dezabonat de la {$screenNames}{-b}
  Nu ar mai trebui să mai primești tweet-uri de la el.

## !!stopchannel
stopChannelInDm =
  {-b}Folosește această comandă în server-ul dorit.{-b}
  Nu este necesară utilizarea unui argument în DMs. Dacă vrei să oprești toate abonamentele din DM, folosește comanda `{-pr}stopchannel`.

noSuchChannel =
  {-b}Nu am putut găsi canalul {$targetChannel} din server-ul tău.{-b}
  Dacă l-ai șters, nu-ți face griji, probabil că l-am părăsit cu mult înainte!

stopChannelSuccess =
  {-b}Te-am dezabonat de la {$subs} {$subs ->
    [one] utilizator
    *[other] utilizatori
  }.{-b}
  Acum ar trebui să nu mai primești vreun tweet în canalul {$channelName}.

## !!lang
noSuchLang =
  {-b}Nu cunosc această limbă!{-b}
  Poți utiliza comanda `{-pr}lang list` pentru a vedea o listă cu limbile cunoscute de mine!

langSuccess =
  {-b}Limba a fost schimbată cu succes!{-b}
  Bine ai venit în minunata lume a limbii române!

## General
invalidVerb = 
  {-b}Comanda a eșuat!{-b}
  Verb invalid: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}Nu pot găsi {$count ->
    [1] un utilizator Twitter cu numele
    *[other] oricare din utilizatorii:
  } {$name}.{-b}
  Cel mai probabil ai încercat să le folosești {$count ->
    [1] numele
    *[other] numele
  } și nu twitter-ul lor {$count -> 
    [1] de afișat
    *[other] de afișat
  }.

tooManyUsersRequested =
  {-b}Prea mulți utilizatori au fost ceruți!{-b}
  Se pare că am cerut prea mulți utilizatori de la Twitter. Acest lucru nu ar trebui să se întâmple, dar între timp încearcă să ceri mai puțini utilizatori!

noSuchTwitterId =
  {-b}Nu un astfel de ID{-b}
  Twitter spune că nu exista niciun tweet cu acest ID!

twitterUnknwnError =
  {-b}Ceva nu a mers bine în încercarea de a interacționa cu Twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Comanda proprietarului bot-ului
# Generic error indicator
-notAuthorized = Neautorizat

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Scuze, doar proprietarul meu poate să facă anunțuri prin intermediul meu!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Această comandă este permisă doar în DMs.
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Doar moderatorii pot anula un abonament!
startForMods = 
  {-b}{-notAuthorized}{-b}
 Pentru a te abona la un cont de twitter, trebuie să fii moderator sau să ai un rol potrivit!
langForMods =
  {-b}{-notAuthorized}{-b}
  Doar moderatorii pot utiliza comenzi legate de limbă!

### Lists
genericEmptyList = Lista este goală, nimic de afișat.

noUserSubscriptions = 
  {-b}Acest utilizator nu are niciun abonament!{-b}
  Acest lucru nu ar trebui să se întâmple! D:

noSubscriptions = 
  {-b}Nu ai niciun abonament!{-b}
  Folosește `{-pr}start <{-screen-name-variable}>` pentru a începe!

# Flag formatting is on one line, in plain text
formatFlags = Cu {$notext -> 
    *[0] postare text
    [1] fără postare text
  }, {$retweet ->
    *[0] fără retweet-uri
    [1] retweet-uri
  }, {$noquote ->
    *[0] citate
    [1] fără citate
  }.

genericObjects = {$count} {$count -> 
    [one] obiect
    *[other] obiecte
  }

subscriptions = {$count} {$count -> 
    [one] abonament
    *[other] abonamente
  }

languages = {$count} {$count -> 
    [one] limbă
    *[other] limbi
  }

### Posting errors
postPermissionError =
  {-b}Permisiuni lipsă:{-b} Nu am putut trimite un mesaj în {$name}.
  Dacă un moderator ar putea să-mi dea permisiunile {-b}Send Messages{-b}, {-b}Send Embeds{-b} și {-b}Attach Files{-b} în canalul dorit, ar fi drăguț.
  Dacă dorești să mă opresc din a trimite mesaje într-un loc respectiv, moderatorii pot folosi comanda `{-pr}stopchannel {$id}`.
  Dacă tu crezi că ai făcut totul corect, însa primești acest mesaj în locul rezultatului dorit, intră pe server-ul nostru suport, ai link-ul în mesajul comenzii `{-pr}help` .

### Credit
languageCredit = Română, traducător `Blind#0784`
