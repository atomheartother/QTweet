## Help messages
helpHeader = {-bot-name} is here to help!

helpIntro =
  Hello, I'm { -bot-name }, I'm a very simple bot who cross-posts twitter posts to Discord!
  {-b}You should read my [complete documentation]({ -docs-url }){-b}
  {-b}Want to invite me to your server?{-b} [Click here]({ -invite-url })!
  {-b}Problems, questions?{-b} [We have a support server!]({ -support-server })
  Here's a short list of commands to get you started:

genericDmResponse =
  Hello, I'm {-bot-name}!
  Type {-pr}help to see a list of my commands! ❤"

## Command usage
-usage = Usage
-screen-name-variable = twitter_screen_name
usage-tweet = 
  Post the latest tweet(s) from the given user.
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [count]`

usage-start =
  Subscribe to a twitter user and post their tweets in real time.
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  Supports multiple users, retweets, filtering out text posts and more! Check out the documentation!`

usage-stop = 
  Unsubscribe from the given user.
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  Exactly like {-pr}stop but acts on the whole channel.
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Print a list of the twitter users you're currently subscribed to.

usage-admin-channel = {-usage}: `{-pr}admin c <id>`
usage-admin-twitter = {-usage}: `{-pr}admin t <screen_name>`
usage-admin-guild = {-usage}: `{-pr}admin g <guild_id>`

usage-lang = {-usage}: `{-pr}lang <list|set <language> >`

## Command feedback
### !!tweet
countIsNaN =
  {-b}I need a number of tweets to get!{-b}
  Wait a minute, {$count} isn't a number! >:c

tweetCountLimited = 
  {-b}Limited to {$maxCount} tweets{-b}
  You're not a mod so I have to limit you - here's the latest {$maxCount} tweets!

tweetCountUnderOne =
  {-b}You asked me to post {$count} tweets, so I won't post any{-b}
  Nice try~

tweetCountHighConfirm =
  {-b}You're asking for a lot of tweets{-b}\nAre you sure you want me to post {$count} tweets? Once I start, you won't be able to stop me!
  If you're sure you want me to do it, run:
  `{-pr}tweet {$screenName} {$count} --force`

tweetNotAuthorized =
  {-b}I tried getting a tweet from {$screenName} but Twitter tells me that's unauthorized.{-b}
  This is usually caused by a blocked account.

tweetUnknwnError =
  {-b}{$screenName} does exist but something seems wrong with their profile{-b}
  I can't get their timeline... Twitter had this to say:
  {$error}

noTweets = "It doesn't look like " + screenName + " has any tweets... "

noValidTweets =
  {-b}This user doesn't seem to have any valid tweets{-b}
  You might want to try again, maybe Twitter messed up?

tweetGeneralError = 
  {-b}Something went wrong getting tweets from {$screenName}{-b}
  I'm looking into it, sorry for the trouble!

## !!tweetId
tweetIdGeneralError =
  {-b}Something went wrong getting tweet {$id}{-b}
  I'm looking into it, sorry for the trouble!

## !!start
startGeneralError =
  {-b}Something went wrong getting the info for {$namesCount ->
  [one] this account
  *[other] these accounts
  }{-b}
  The problem appears to be on my end, sorry for the trouble!

startSuccess =
  {-b}You're now subscribed to {$addedObjectName}!{-b}
  Remember you can stop me at any time with `{-pr}stop {$nameCount ->
    [one] $firstName
    *[other] <screen_name>
  }`.
  It can take up to 20min to start getting tweets from them, but once it starts, it'll be in real time!

  {$missedNames ->
    [0] {""}
    *[other] It also appears I was unable to find some of the users you specified, make sure you used their screen name!
  }

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
  {-b}Something went wrong trying to unsubscribe from {$screenName}{-b}
  I'm looking into it, sorry for the trouble!

## !!stopchannel
stopChannelInDm =
  {-b}Use this command in the server you want to target{-b}
  You don't have to use an argument in DMs. If you want to stop all DM subscriptions just run `{-pr}stopchannel`.

noSuchChannel =
  {-b}I couldn't find channel {$targetChannel} in your server.{-b}
  If you deleted it, I've probably already left it, don't worry!

stopChannelSuccess =
  {-b}I've unsubscribed you from {$users} users{-b}
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

adminInvalidTwitter =
  I'm not getting any user called `@{$screenName}`

## General
invalidVerb = 
  {-b}Command failed{-b}
  Invalid verb: {$verb}

## General twitter errors
noSuchTwitterUser =
  {-b}I can't find {$count ->
    [1] a Twitter user by the name of $name
    *[other] any of those users: $name
  }
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
  Sorry, I've never seen this error before. I'll do my best to fix it soon!

## DM sent to server owner.
welcomeMessage = 
      Hello, I'm {-bot-name}, thanks for inviting me to your server!
      {-b}To get started:{-b} `{-pr}help` for commands and useful links!
      {-b}If I'm useful to your server{-b}, please consider upvoting me at {-profile-url}
      
      By using any of my commands, you agree that {-b}any content posted to your server or DMs through me is your own responsibility{-b}, check out my documentation for more information.

## Command permissions error msg
-botOwnerCmd = Bot Owner command
-notAuthorized = Not authorized

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, only my owner can do announcements!
leaveForAdmin =
  {-b}{-botOwnerCmd}{-b}
  Sorry, only my owner can force me off a server
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Only moderators can unsubscribe from a twitter account!
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  For user privacy reasons, this command is only allowed in DMs.
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
  Only moderators can change perform language commands!

## Lists and formatting
genericObjects = objects
subscriptions = subscriptions
languages = languages

id = ID
type = Type
dm = dm
serv = server

genericEmptyList = List is empty, nothing to display.

noUserSubscriptions = 
  {-b}This user has no subscriptions{-b}
  This shouldn't happen :c

noSubscriptions = 
  {-b}You're not subscribed to anyone{-b}
  Use `{-pr}start <screen_name>` to get started!

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

## Credit
languageCredit = English, made by `Tom'#4242`