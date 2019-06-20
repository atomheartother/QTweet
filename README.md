# QTweet - the Tweeting qt

[![Discord Bots](https://discordbots.org/api/widget/433615162394804224.svg)](https://discordbots.org/bot/433615162394804224)

This bot will fetch Twitter posts in real time and link them to Discord. The typical use is to cross-post tweets from a Twitter bot who posts pictures every hour for example, to your preferred Discord
server.

You never have to use Twitter again, just get the good stuff posted to your Discord server.

![A QT Tweeting](https://cdn.discordapp.com/attachments/141566322730467328/591402397285351446/unknown.png)

# Features

- Get the latest **text, image, album and video** tweet(s) from any twitter user, formatted for Discord.
- Cross-post tweets from Twitter to Discord in **real time**.
- Supports **retweets and quotes**, highlights hashtags and user mentions...
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

Usage: `!!start <screen_name> [screen_name2 screen_name3 ...] [--notext] [--retweet] [--noquote]`

This command will cause QTweet to start posting tweets from this user (or these users) automatically into this discord channel, in real-time. It will take her a bit (between 5 and 20min) to start posting them because of twitter rate limits, but once she gets started they will be real-time. Works in DMs.

Options:

`--notext`: Don't post text tweets

`--retweet`: Post retweets

`--noquote`: Don't post quotes. Quotes are when an account retweets and adds a comment to the post. I make 2 posts for those, one for the quote and then one for the quoted message.

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

# Motivation, Philosophy, Legal notice

I don't like Twitter but I like a few accounts on it. This is my solution. I value privacy above all, and none of your personal data or messages are being stored anywhere, QTweet only keeps records of what she needs to know (channel ids, twitter usernames, and that's about it), and doesn't record any personal information, nor does she even store a record of which tweets she forwards to your server.

I am able to see which servers she's used in, for the purposes of debugging and contacting server owners. That's about it.

By using QTweet's commands you agree that you are responsible for the content you have QTweet repost to your respective servers. I can't be held liable for any illegal content or any content breaking Discord's TOS which makes its way onto your servers by way of my bot. By accepting automatic tweets from an account into a channel, you are expressing your trust that this account will post content that respects the channel's rules, and Discord's rules. I do not monitor content posted automatically but if I come upon anything illegal I will remove it and report you to Discord.
