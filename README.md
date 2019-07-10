# QTweet - the Tweeting qt

[![Discord Bots](https://discordbots.org/api/widget/433615162394804224.svg)](https://discordbots.org/bot/433615162394804224)

This bot will fetch Twitter posts in real time and link them to Discord. The typical use is to cross-post tweets from a Twitter bot who posts pictures every hour for example, to your preferred Discord
server.

You never have to use Twitter again, just get the good stuff posted to your Discord server.
!["universe"](img/preview.png?raw=true "A QT tweeting")

# Features

- Get the latest **text, image, album and video** tweet(s) from any twitter user, formatted for Discord.
- Cross-post tweets from Twitter to Discord in **real time**.
- Supports **retweets and quotes**, highlights hashtags and user mentions...
- Ping your Discord server members directly from twitter with the `--ping` option!
- **Can post to DMs** directly!

# Usage, Permissions

Here's a detailed breakdown of QTweet's commands. I break them down in three permission categories. I use the standard notation for command parameters: `<param>` means that it's an obligatory parameter, `[param]` means it's optional. If you don't get it, don't worry there's examples c:

## Everyone

Everyone who can send messages in a channel QTweet is in can use these commands. So basically, if you don't want users to be able to do these, don't let them send messages in that channel.

### tweet

Usage: `!!tweet <screen_name> [count]`
Gets the latest tweet from a twitter user and posts it in this channel. Works in DMs.
Examples:

`!!tweet HamsterFragment` will post the latest tweet from @HamsterFragmentt.

`!!tweet HamsterFragment 5` will post the 5 latest tweets from @HamsterFragment.

### list

Usage: `!!list`

Lists all the users whose tweets you're getting automatically **in the current channel**.

### help

Usage: `!!help`

Posts a simple help message with some basic command usage.

## Mods

I consider a mod anyone who has elevated powers over QTweet in a channel. By default, that's the **server admins** and anyone with **manage channels** or **manage guild** permissions.

You can allow anyone to be a QTweet mod by giving them the `qtweet-mod` role.

### start

Usage: `!!start <screen_name> [screen_name2 screen_name3 ...] [--notext] [--retweet] [--noquote] [--ping]`

This command will cause QTweet to start posting tweets from this user (or these users) automatically into this discord channel, in real-time. It will take her a bit (between 5 and 20min) to start posting them because of twitter rate limits, but once she gets started they will be real-time. Works in DMs.

Options:

`--notext`: Don't post text tweets

`--retweet`: Post retweets

`--noquote`: Don't post quotes. Quotes are when an account retweets and adds a comment to the post. I make 2 posts for those, one for the quote and then one for the quoted message.

`--ping`: Ping `@everyone` in the channel when a tweet with the hashtag "#qtweet" is posted from this account. Meant to be used for streamers and the likes.

Examples:

`!!start HamsterFragment --notext`: Will start posting tweets from @HamsterFragment, but not their text posts.

`!!start HamsterFragment billwurtz`: Will start posting tweets from @HamsterFragment and @billwurtz.

`!!start HamsterFragment --retweet --noquote`: Will post tweets and retweets from @HamsterFragment but not their quotes.

### stop

Usage: `!!stop <screen_name>`

Causes QTweet to stop sending you tweets from this particular user.

Example:

- `!!stop HamsterFragment`: Will stop posting tweets from @HamsterFragment

### stopchannel

Usage: `!!stopchannel [channelID]`

Acts like `!!stop` but on the whole channel. This is a command I made for two cases:

- If you want to quickly remove all of QTweet's gets from a channel
- If you stopped giving QTweet the right to post in a channel but she keeps trying to post to it and she keeps asking you for permission.

Examples:

`!!stopchannel`: Will stop getting posting any tweets in this channel.

`!!stopchannel 464858170259406850`: Will stop posting any tweets in the channel with ID #464858170259406850. This command must be ran **in the server this channel is in**, it cannot be run in DMs!

## Bot Owner

This is only for me at the moment, it could be for you if you run **your own instance of QTweet**. QTweet knows who her owner is from the owner ID in `config.json`.

### adminlist

`!!adminlist` has been deprecated, `!!admin` is in the process of being built.

### leaveguild

Usage: `!!leaveguild <guildId>`

Force QTweet to leave a guild. Useful if the owner really messed up or something.

### announce

Usage: `!!announce <message>`

Posts an announcement to **every guild QTweet is currently posting in**. If a guild has multiple channel she's posting in, she will pick one and stick to it, she won't post the message across all channels. I use this to warn users in case of outages and that kind of stuff. Do not use this lightly.

## Notes

QTweet understands 3 formats for twitter screen names, therefore these 3 commands are equivalent:

- `!!start HamsterFragment`
- `!!start @HamsterFragment`
- `!!start https://twitter.com/HamsterFragment`

# Not So FAQ

## Can I add QTweet to my server?

If you wanna add QTweet to your server, you can just click [this link](https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=51264).

## Can I modify and run your bot?

Yes, unlike a lot of Discord bots, QTweet is open source. It'd be nice if you credited me. It runs like any old node package. You just need to fill in the `pw.json` file with your keys, then run `yarn start` (or `npm run start` if you're lame) and you're good to go. The code isn't commented enough to my liking but it should be understandable enough, if you have a question feel free to file an issue.

You can also deploy it to docker, that's more kinda up to you, you'll have to make a volume mounted on the `data/` folder. DM me or file an issue for more info.

Some stuff is already variable, you can change the configuration variables in `config.json` like the command prefix and the `get` file location.

## I think your bot needs X feature

QTweet is designed to do one thing and do it well, I don't care much to make it too multifunction like a lot of Discord bots tend to be. However if you think a feature would work with her specific purpose then feel free to drop an issue. Even better, implement it yourself and make a PR!

# Philosophy, Privacy, Legal Notice

I don't like Twitter but I like a few accounts on it. This is my solution. I value privacy above all, and none of your personal data or messages are being stored anywhere, QTweet only keeps records of what she needs to know and doesn't record any personal information, nor does she even store a record of which tweets she forwards to your server.

In an effort of transparency, here's what I believe to be an exhaustive list of what QTweet stores and what I can access. None of the data described hereafter is being sold to anyone.

In the database, which I make regular backups of (I do eventually remove outdated backups, however that is manual and I have no guarantee for how long your data is stored):

- **Twitter IDs** and **screen names** of accounts you subscribed to, which are necessary for her to function
- **Channel ID**, **Guild ID** and **owner ID** for every channel she has at least a single subscription in, which I need to link subscriptions to channels and to be able to keep track of per-guild subscriptions.

Some additional info is displayed in my logs, which are lost when I reboot QTweet:

- The **channel name**, **guild name** and **channel ID** for the relevant channel, I like to have the names as they give me an idea of where QTweet is being used and make my logs more pleasant to look at, the channelID lets me look into bugs.
- When a command runs, I display the **author's tag** and the full command, to be able to debug when something goes wrong.
- In some cases of error I'll display the **contents of the message** QTweet was trying to send to your channel. If it was a tweet, this is the only case of me directly accessing tweet data, and it is quite rare. I do this to be able to debug errors.

Additionally, in real-time, I may ask QTweet for some additional info for debugging purposes, which may be stored indefinitely in my private chat with QTweet since I use Discord to communicate with her:

- **Display names and links** to the accounts you're subscribed to, to be able to debug eventual problems when you come to me with a report.
- **Channel names**, **server name**, **number of server members**, which are nice for me to know, again to know how QTweet is being used.
- **Server Owner's tag**, to be able to contact them.

QTweet herself may have access to a _lot_ more data, like every bot, including but not limited to every single message that's in channels she can see & the tag of every single user in your server, however **I do not ever access or store that data**.

By using QTweet's commands you agree that you are responsible for the content you have QTweet repost to your respective servers. I can't be held liable for any illegal content or any content breaking Discord's TOS which makes its way onto your servers by way of my bot. By accepting automatic tweets from an account into a channel, you are expressing your trust that this account will post content that respects the channel's rules, and Discord's rules. I do not monitor content posted automatically but if I come upon anything illegal I will remove it and report you to Discord.
