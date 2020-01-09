# QTweet - the Tweeting qt

[![Discord Bots](https://discordbots.org/api/widget/433615162394804224.svg)](https://discordbots.org/bot/433615162394804224)

This bot will fetch Twitter posts in real time and link them to Discord. The typical use is to cross-post tweets from a Twitter bot who posts pictures every hour for example, to your preferred Discord
server.

You never have to use Twitter again, just get the good stuff posted to your Discord server.
!["universe"](img/preview.png?raw=true "A QT tweeting")

[You can support QTweet with a Patreon donation](https://www.patreon.com/atomheartother)! All money goes towards servers and other running costs - even \$1 helps!

# Features

- Get the latest **text, image, album and video** tweet(s) from any twitter user, formatted for Discord.
- Cross-post tweets from Twitter to Discord in **real time**.
- Supports **retweets and quotes**, highlights hashtags and user mentions...
- Ping your Discord server members directly from twitter with the `--ping` option!
- **Can post to DMs** directly!

# Documentation, commands, etc
[QTweet's full documentation can be found here](https://docs.google.com/document/d/1LGxfhxptioc653pqJaY5owwpZmzTg4rggqwBYcgO73I/edit?usp=sharing).

It contains:
- A detailed command guide describing what you can do with QTweet
- The translation guide, for those of you who want to translate QTweet
- A hosting guide, which will put you on the right path to run your own instance of QTweet.

# Not So FAQ

## Can I add QTweet to my server?

If you wanna add QTweet to your server, you can just click [this link](https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=51264).

## Can I modify and run your bot?

Yes, unlike a lot of Discord bots, QTweet is open source and meant to be run on independent instances. You can find a guide to hosting your own instance in the [full documentation](https://docs.google.com/document/d/1LGxfhxptioc653pqJaY5owwpZmzTg4rggqwBYcgO73I/edit?usp=sharing).

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
