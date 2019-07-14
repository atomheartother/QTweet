# Global variables
## Prefix: This is the prefix that goes in front of commands
-bot-name = QTweet
-profile-url = {"https://discordbots.org/bot/433615162394804224"}
-docs-url = {"https://github.com/atomheartother/QTweet"}
-invite-url = {"https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=51264"}
-support-server = {"https://discord.gg/bF7yCdd"}
-pr = {"!!"}

# Formatting
## Put this around text to put it in bold
-b = {"**"}

## Help message
helpIntro =
  Hello, I'm { -bot-name }, I'm a very simple bot who cross-posts twitter posts to Discord!
  {-b}You should read my [complete documentation]({ -docs-url }){-b}
  {-b}Want to invite me to your server?{-b} [Click here]({ -invite-url })!
  {-b}Problems, questions?{-b} [We have a support server!]({ -support-server })
  Here's a short list of commands to get you started:

## Command usage
usage-tweet = 
  Post the latest tweet(s) from the given user.
  {-b}Usage{-b}: `{-pr}tweet <twitter_screen_name> [count]`

usage-start =
  Subscribe to a twitter user and post their tweets in real time.
  {-b}Usage{-b}: `{-pr}start <twitter_screen_name> [flags]`
  Supports multiple users, retweets, filtering out text posts and more! Check out the documentation!`

usage-stop = 
  Unsubscribe from the given user.
  {-b}Usage{-b}: `{-pr}stop <twitter_screen_name>`

usage-stopchannel =
  Exactly like {-pr}stop but acts on the whole channel.
  {-b}Usage{-b}: `{-pr}stopchannel [channel ID]`

usage-list = Print a list of the twitter users you're currently subscribed to.

## DM sent to server owner. This will always be in english.
welcomeMessage = 
      Hello, I'm {-bot-name}, thanks for inviting me to your server!
      {-b}To get started:{-b} `{-pr}help` for commands and useful links!
      {-b}If I'm useful to your server{-b}, please consider upvoting me at {-profile-url}
      
      By using any of my commands, you agree that {-b}any content posted to your server or DMs through me is your own responsibility{-b}, check out my documentation for more information.

## Command permissions error msg
-botOwnerCmd = Bot Owner command
-notAuthorized = Not Authorized

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