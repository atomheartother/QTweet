# Small words
id = ID
type = Type
dm = mp
serv = serveur

## Help messages
helpHeader = {-bot-name} est là!

helpIntro =
  Bonjour, je suis { -bot-name }, je suis un robot qui envoie des tweets sur Discord!
  {-b}Tu devrais lire ma [documentation complète]({ -docs-url }){-b}
  {-b}Tu veux m'inviter sur ton serveur?{-b} [Clique ici]({ -invite-url })!
  {-b}Un problème, une question?{-b} [On a un serveur de support!]({ -support-server })
  Voilà une liste de quelques unes de mes commandes:

helpFooter = Image de profil faite par {$artist}

welcomeMessage = 
      Bonjour, je suis {-bot-name}, merci de m'avoir invité dans votre serveur!
      {-b}Pour commencer:{-b} `{-pr}help` pour des commandes & liens utiles!
      {-b}Si je suis utile à votre serveur{-b}, votez pour moi à {-profile-url}
      En utilisant mes commandes, vous agréez du fait que {-b}tout contenu envoyé sur votre serveur ou vos MPs à travers moi est votre responsabilité{-b}, lisez ma documentation pour plus d'information.

## Command usage
-usage = Utilisation
-screen-name-variable = nom_utilisateur_twitter
usage-tweet = 
  Envoie le dernier tweet d'un utilisateur
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=nombre]`

usage-start =
  S'abonne à un utilisateur Twitter et envoye ses tweets en temps réel.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [options]`
  Supporte plusieurs utilisateurs, les retweets, le filtrage des tweets texte et plus! Cf. la documentation

usage-stop = 
  Se désabonne d'un utilisateur.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Exactement comme {-pr}stop mais agit sur tout le salon.
  {-b}{-usage}{-b}: `{-pr}stopchannel [ID salon]`

usage-list = Affiche la liste de vos abonnements pour ce salon.

usage-admin = {-usage}: `{-pr}admin <channel|twitter|guild>`
usage-admin-channel = {-usage}: `{-pr}admin c <id_salon>`
usage-admin-twitter = {-usage}: `{-pr}admin t <{-screen-name-variable}>`
usage-admin-guild = {-usage}: `{-pr}admin g <id_guilde>`

usage-lang = {-usage}: `{-pr}lang [list|set <langage>]`
usage-lang-set = {-usage}: `{-pr}lang set <langage>`

## Command feedback
-error-apology = Je suis sur le coup, désolée du désagrément!
### !!tweet
countIsNaN =
  {-b}J'ai besoin d'un nombre de tweets{-b}
  {$count} n'est pas un nombre! >:c

tweetCountLimited = 
  {-b}Limité à {$maxCount} tweets{-b}
  Tu n'es pas un modo donc je dois te limiter - voici les derniers {$maxCount} tweets!

tweetCountUnderOne =
  {-b}Tu m'as demandé d'envoyer {$count} tweets, donc je n'en envoie aucun.{-b}
  Bien essayé~

tweetCountHighConfirm =
  {-b}Tu m'as demandé d'envoyer beaucoup de tweets{-b}
  Es-tu sûr·e de vouloir {$count} tweets? Une fois que j'aurais commencé je ne peux pas être arrêtée!
  Si tu est bien sûr·e, envoie:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}J'ai essayé d'obtenir un tweet de {$screenName} mais Twitter me dit que ne ne suis pas autorisé.{-b}
  La cause de cette erreur est souvent un compte bloqué.

tweetUnknwnError =
  {-b}{$screenName} existe bien mais il y a un problème avec leur compte{-b}
  Je ne peux pas obtenir leur fil de tweets... Voici ce que Twitter a à dire:
  {$error}

noTweets = On dirait que {$screenName} n'a pas de tweets...

noValidTweets =
  {-b}Cet utilisateur ne semble pas avoir de tweets valides{-b}
  Réessaie, il se peut que Twitter aie fait une erreur.

tweetGeneralError = 
  {-b}J'ai rencontré une erreur en obtenant le tweet de {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}J'ai rencontré une erreur en obtenant le tweet {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}J'ai rencontré une erreur en obtenant des infos sur {$namesCount ->
  [one] ce compte
  *[other] ces comptes
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}Tu es maintenant abonné·e à {$addedObjectName}!{-b}
  Tu peux toujours m'arrêter avec `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
  }`.
  Obtenir le premier tweet peut me prendre jusqu'à 20min, mais après ça tout sera en temps réel!

  {$missedNames ->
    [0] {""}
    *[other] Je n'ai pas pu t'abonner à certains des noms que tu m'as donné, vérifie-les bien!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} et {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} mis à jour!{-b}
  Tes nouvelles options ont été mises à jour. Les changements devraient être instantanés.

## !!leaveguild
noValidGid = Pas d'ID de guilde valide fourni.

guildNotFound = Je n'ai pas pu trouver la guilde {$guild}.

leaveSuccess = J'ai quitté la guilde {$name}

## !!stop
noSuchSubscription =
  {-b}Tu n'es pas abonné·e à {$screenNames}{-b}
  Entre `{-pr}list` pour une liste de tes abonnements!

stopSuccess =
  {-b}Je t'ai désabonné de {$screenNames}{-b}
  Tu ne devrais plus recevoir de tweets de leur part.

## !!stopchannel
stopChannelInDm =
  {-b}Utilise cette commande dans le serveur que tu veux viser{-b}
  Tu n'as pas besoin de préciser un numéro de chaine dans les MP. Si tu veux arrêter tous tes abonnements DM, utilises `{-pr}stopchannel`.

noSuchChannel =
  {-b}Je n'ai pas pu trouver le salon {$targetChannel} dans ton seveur.{-b}
  S'il est déjà supprimé, je l'ai sûrement déjà quitté, ne t'inquiètes pas!

stopChannelSuccess =
  {-b}Je {$subs ->
    [0] ne t'ai désabonné de personne
    [one] t'ai désabonné d'un utilisateur
    *[other] t'ai désabonné de {$subs} utilisateurs
  }.{-b}
  Tu devrais ne plus recevoir de tweets dans {$channelName}.

## !!lang
noSuchLang =
  {-b}Je ne supporte pas ce langage{-b}
  Entre `{-pr}lang list` pour voir une liste des langage que tu peux utiliser!

langSuccess =
  {-b}Langage modifié{-b}
  Je parlerai désormais dans la langue de Molière!

## !!admin
adminInvalidId = Je n'ai pas pu construre un objet salon valide avec ID: {$channelId}

adminInvalidTwitter = Je ne suis abonné à aucun utilisateur nommé `@{$screenName}`

## General
invalidVerb = 
  {-b}Commande échouée{-b}
  Verbe invalide: {$verb}

## General twitter errors
noSuchTwitterUser =
  {-b}Je ne peux {$count ->
    [one] pas trouver un compte Twitter nommé
    *[other] trouver aucun de ces comptes:
  } {$name}.{-b}
  Tu as certainement utilisé {$count ->
    [one] leur nom affiché
    *[other] leurs noms affichés
  } et pas {$count -> 
    [one] leur nom d'utilisateur
    *[other] leurs noms d'utilisateur
  }.

tooManyUsersRequested =
  {-b}Trop de requêtes utilisateur{-b}
  Il semblerait que j'aie demandé trop d'utilisateurs à Twitter. Ça ne devrait pas arriver, mais en attendant essaie de demander moins d'utilisateurs!

noSuchTwitterId =
  {-b}Cet ID n'existe pas{-b}
  Twitter dit qu'il n'existe pas de tweet avec cet ID

twitterUnknwnError =
  {-b}J'ai rencontré une erreur en intéragissant avec twitter{-b}
  {-error-apology}

## Command permissions error msg
-botOwnerCmd = Commande réservée au propriétaire du bot
-notAuthorized = Non autorisé

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Désolée, seul mon propriétaire peut faire des annonces!
leaveForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Désolée, seul mon propriétaire peut me forcer à quitter un serveur.
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  Cette commande n'est autorisée que dans les MPs.
adminForAdmin = 
  {-b}{-botOwnerCmd}{-b}
  Cette commande accède aux données d'autres serveurs donc seul mon propriétaire peut l'utiliser!
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Seul·e un·e modérateur·trice peut me désabonner d'un compte twitter!
startForMods = 
  {-b}{-notAuthorized}{-b}
  Pour t'abonner à un compte Twitter tu dois être un·e modérateur·trice ou avoir le bon rôle.
langForMods =
  {-b}{-notAuthorized}{-b}
  Seuls·es les modérateurs·trices peuvent lancer les commandes de langage!

## Lists and formatting

genericEmptyList = La liste est vide, rien à montrer.

noUserSubscriptions = 
  {-b}Cet·tte utilisateur·tice n'a pas d'abonnements{-b}
  Ça ne devrait pas arriver :c

noSubscriptions = 
  {-b}Vous n'êtes abonnés·ées à personne{-b}
  Utilisez `{-pr}start <{-screen-name-variable}>` pour commencer!

formatFlags = Avec {$notext -> 
    *[0] les tweets texte
    [1] pas de tweets texte
  }, {$retweet ->
    *[0] pas de retweets
    [1] les retweets
  }, {$noquote ->
    *[0] les citations
    [1] pas de citations
  }, les pings {$ping -> 
    *[0] off
    [1] on
  }

genericObjects = {$count} {$count -> 
    [one] objet
    *[other] objets
  }

subscriptions = {$count} {$count -> 
    [one] abonnement
    *[other] abonnements
  }

languages = {$count} {$count -> 
    [one] langage
    *[other] langages
  }

## Posting errors
postPermissionError =
  {-b}Permissions Manquantes:{-b} Je n'ai pas pu envoyer un message dans {$name}.
  Si un·e modérateur·trice pouvait m'y donner ces permissions: {-b}Envoyer des Messages{-b}, {-b}Intégrer des liens{-b} et {-b}Joindre des fichiers{-b} ça serait top.
  Si vous voulez que j'arrête d'essayer d'envoyer des messages dans {$name}, vous pouvez utiliser `{-pr}stopchannel {$id}`.
  Si vous pensez avoir tout bien fait mais que je continue de vous envoyer ce message, rejoinez notre serveur de support, il est lié dans `{-pr}help`.

## Credit
languageCredit = Français, traduit par `Tom'#4242`
