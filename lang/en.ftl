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
  Hello, I'm { -bot-name }, I'm a very simple bot who cross-posts twitter posts to Discord!
  {-b}You should read my [complete documentation]({ -docs-url }){-b}
  {-b}Want to invite me to your server?{-b} [Click here]({ -invite-url })!
  {-b}Problems, questions?{-b} [We have a support server!]({ -support-server })
  {-b}Want to support QTweet?{-b} [Make a Patreon donation!]({ -patreon-link })
  
  Here's a short list of commands to get you started:

# Footer giving credit to the artist
helpFooter = Profile picture art by {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      Hello, I'm {-bot-name}, thanks for inviting me to your server!
      {-b}To get started:{-b} `{-pr}help` for commands and useful links!
      {-b}If I'm useful to your server{-b}, please consider upvoting me at {-profile-url}
      
      By using any of my commands, you agree that {-b}any content posted to your server or DMs through me is your own responsibility{-b}, check out my documentation for more information.

### Command usage

# The word "usage"
-usage = Usage
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_screen_name

## Usage for every command
usage-tweet = 
  Post the latest tweet(s) from the given user.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  Subscribe to a twitter user and post their tweets in real time.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Supports multiple users, retweets, filtering out text posts and more! Check out the documentation!

usage-stop = 
  Unsubscribe from the given user.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Exactly like {-pr}stop but acts on the whole channel.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Print a list of this channel's subscriptions.

usage-admin = {-usage}: `{-pr}admin <channel|twitter|guild>`
usage-admin-channel = {-usage}: `{-pr}admin c <channel_id>`
usage-admin-twitter = {-usage}: `{-pr}admin t <{-screen-name-variable}>`
usage-admin-guild = {-usage}: `{-pr}admin g <guild_id>`

usage-lang = 
  List available languages or change the language.
  Read the docs if you want to help translate me in your language!
  {-usage}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

### Command feedback
-error-apology = I'm on it, sorry for the trouble!
## !!tweet
countIsNaN =
  {-b}I need a number of tweets to get!{-b}
  Hey, {$count} isn't a number! >:c

tweetCountLimited = 
  {-b}Limited to {$maxCount} tweets{-b}
  You're not a mod so I have to limit you - here's the latest {$maxCount} tweets!

tweetCountUnderOne =
  {-b}You asked me to post {$count} tweets, so I won't post any{-b}
  Nice try~

tweetCountHighConfirm =
  {-b}You're asking for a lot of tweets{-b}
  Are you sure you want me to post {$count} tweets? Once I start, you won't be able to stop me!
  If you're sure you want me to do it, run:
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}I tried getting a tweet from {$screenName} but Twitter tells me that's unauthorized.{-b}
  This is usually caused by a blocked account.

tweetUnknwnError =
  {-b}{$screenName} does exist but something seems wrong with their profile{-b}
  I can't get their timeline... Twitter had this to say:
  {$error}

noTweets = It doesn't look like {$screenName} has any tweets...

noValidTweets =
  {-b}This user doesn't seem to have any valid tweets{-b}
  You might want to try again, maybe Twitter messed up?

tweetGeneralError = 
  {-b}Something went wrong getting tweets from {$screenName}{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}Something went wrong getting tweet {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}Something went wrong getting the info for {$namesCount ->
  [one] this account
  *[other] these accounts
  }.{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}You're now subscribed to {$addedObjectName}!{-b}
  Remember you can stop me at any time with `{-pr}stop {$nameCount ->
    [one] {$firstName}
    *[other] <{-screen-name-variable}>
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
  {-b}Not subscribed to {$screenNames}{-b}
  Use `{-pr}list` for a list of subscriptions!

stopSuccess =
  {-b}I've unsubscribed you from {$screenNames}{-b}
  You should stop getting any tweets from them.

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
  You should now stop getting any tweets in `{$channelName}`.

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
languageCredit = English, made by `Tom'#4242`