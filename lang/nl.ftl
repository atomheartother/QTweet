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
  Post de meeste recente Tweet(s) van de gegeven gebruiker.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [count]`

usage-start =
  Abonneer op een Twitter gebruiker en post zijn/haar Tweets in real time.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Het is mogelijk om meerdere gebruikers tegelijk te volgen, ook kan je filteren op alleen afbeeldingen en meer, check de documentatie!  
usage-stop = 
  Stop met het volgen van deze gebruiker.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Werkt exact hetzelfde als {-pr}stop maar dan voor het volledige channel.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Post een lijst van de geabonneerde gebruikers in dit channel.

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
  Ik kan de timeline van deze gebruiker niet binnenhalen ... Twitter heeft dit te zeggen:
  {$error}

noTweets = Het ziet er niet naar uit dat {$screenName} Tweets heeft...

noValidTweets =
  {-b}Deze gebruiker heeft geen Tweets die ik kan doorsturen.{-b}
  Probeer het nog een keer, het kan dat Twitter een foutje heeft gemaakt.

tweetGeneralError = 
  {-b}Er is iets mis gegaan met Tweets binnenhalen van {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Er is iets fout gegaan met het binnenhalen van deze Tweet: {$id}{-b}
  {-error-apology}

## !!start
startGeneralError =
  {-b} Er is iets misgegaan met de informatie binnenhalen voor {$namesCount ->
  [one] dit account
  *[other] deze accounts
  }.{-b}
  {-error-apology}

startSuccess =
  {-b}You're now subscribed to {$addedObjectName}!{-b}
  Remember you can stop me at any time with `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <screen_name>
  }`.
  It can take up to 20min to start getting tweets from them, but once it starts, it'll be in real time!

  {$missedNames ->
    [0] {""}
    *[other] It also appears I was unable to find some of the users you specified, make sure you used their screen name!
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} and {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} updated!{-b}
  Your new flags have been registered. The changes should be instant.

## !!leaveguild
noValidGid = No valid guild ID provided

guildNotFound = I couldn't find guild {$guild}.

leaveSuccess = Left guild {$name}

## !!stop
noSuchSubscription =
  {-b}Not subscribed to `@{$screenName}`{-b}
  Use `{-pr}list` for a list of subscriptions!

stopSuccess =
  {-b}I've unsubscribed you from `@{$screenName}`{-b}
  You should stop getting any tweets from them.

stopGeneralError =
  {-b}Something went wrong trying to unsubscribe from `@{$screenName}`{-b}
  {-error-apology}

## !!stopchannel
stopChannelInDm =
  {-b}Use this command in the server you want to target{-b}
  You don't have to use an argument in DMs. If you want to stop all DM subscriptions just run `{-pr}stopchannel`.

noSuchChannel =
  {-b}I couldn't find channel {$targetChannel} in your server.{-b}
  If you deleted it, I've probably already left it, don't worry!

stopChannelSuccess =
  {-b}I've unsubscribed you from {$subs ->
    [one] one user
    *[other] {$subs} users
  }.{-b}
  You should now stop getting any tweets in {$channelName}.

## !!lang
noSuchLang =
  {-b}I don't support this language{-b}
  You can run `{-pr}lang list` to see a list of supported languages

langSuccess =
  {-b}Language changed successfully{-b}
  Welcome to the magical world of english!

## !!admin
adminInvalidId = I couldn't build a valid channel object with id: {$channelId}

adminInvalidTwitter = I'm not subscribed to any user called `@{$screenName}`

## General
invalidVerb = 
  {-b}Command failed{-b}
  Invalid verb: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}I can't find {$count ->
    [1] a Twitter user by the name of
    *[other] any of those users:
  } {$name}.{-b}
  You most likely tried using their display {$count ->
    [1] name
    *[other] names
  } and not their twitter {$count -> 
    [1] handle
    *[other] handles
  }.

tooManyUsersRequested =
  {-b}Too many users requested{-b}
  It seems I requested too many users to twitter. This shouldn't happen, but in the meantime try requesting fewer users!

noSuchTwitterId =
  {-b}No such ID{-b}
  Twitter says there's no tweet with this id!

twitterUnknwnError =
  {-b}Something went wrong interacting with twitter!{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Bot Owner command
# Generic error indicator
-notAuthorized = Not authorized

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, only my owner can do announcements!
leaveForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, only my owner can force me off a server.
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  This command is only allowed in DMs.
adminForAdmin = 
  {-b}{-botOwnerCmd}{-b}
  This command accesses other servers' data so only my owner can use it!
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Only moderators can unsubscribe from a twitter account!
startForMods = 
  {-b}{-notAuthorized}{-b}
  To subscribe to a twitter account you need to be a moderator or have the proper role!
langForMods =
  {-b}{-notAuthorized}{-b}
  Only moderators can perform language commands!

### Lists
genericEmptyList = List is empty, nothing to display.

noUserSubscriptions = 
  {-b}This user has no subscriptions{-b}
  This shouldn't happen :c

noSubscriptions = 
  {-b}You're not subscribed to anyone{-b}
  Use `{-pr}start <{-screen-name-variable}>` to get started!

# Flag formatting is on one line, in plain text
formatFlags = With {$notext -> 
    *[0] text posts
    [1] no text posts
  }, {$retweet ->
    *[0] no retweets
    [1] retweets
  }, {$noquote ->
    *[0] quotes
    [1] no quotes
  }, pings {$ping -> 
    *[0] off
    [1] on
  }

genericObjects = {$count} {$count -> 
    [one] object
    *[other] objects
  }

subscriptions = {$count} {$count -> 
    [one] subscription
    *[other] subscriptions
  }

languages = {$count} {$count -> 
    [one] language
    *[other] languages
  }

### Posting errors
postPermissionError =
  {-b}Missing Permissions:{-b} I couldn't send a message in {$name}.
  If a mod could give me the {-b}Send Messages{-b}, {-b}Send Embeds{-b} and {-b}Attach Files{-b} permissions there that would be nice.
  If you'd like me to stop trying to send messages there, moderators can use `{-pr}stopchannel {$id}`.
  If you think you've done everything right but keep getting this message, join our support server, it's linked in my `{-pr}help` message.

### Credit
languageCredit = English, made by `Tom'#4242`