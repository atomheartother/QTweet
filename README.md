# QTweet - the Tweeting qt

This bot will fetch Twitter posts in real time and link them to Discord. The typical use is to cross-post tweets from a Twitter bot who posts pictures every hour for example, to your preferred Discord
server.

You never have to use Twitter again, just get the good stuff posted to your Discord server.

![A QT Tweeting](https://raw.githubusercontent.com/atomheartother/QTweet/master/img/example.jpg)

## Features

- Get the latest text, image and video tweets from any twitter user, formatted for Discord.
- Cross-post tweets from Twitter to Discord in real time.
- A "like" button, so that you know which of your Discord buddies liked that post.
- By default, only the _server owner_ can start automatically fetching tweets. Want to grant that power to someone? Give them the `qtweet` role!

## Can I add QTweet to my server?

If you wanna add QTweet to your server, you can just click [this link](https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=0).

## Can I modify and run your bot?

Yes, unlike a lot of Discord bots, QTweet is open source. It'd be nice if you credited me. It runs like any old npm package. You just need to fill in the `pw.json` file with your keys, then run `node index.js` and you're good to go. The code isn't commented enough to my liking but it should be understandable enough, if you have a question feel free to file an issue.

Some stuff is already variable, you can change the configuration variables in `config.json` like the command prefix and the `get` file location.

## I think your bot needs X feature

QTweet is designed to do one thing and do it well, I don't care much to make it too multifunction like a lot of Discord bots tend to be. However if you think a feature would work with her specific purpose then feel free to drop an issue. Even better, implement it yourself and make a PR!

## Motivation, Philosophy, Privacy notice

I don't like Twitter but I like a few accounts on it. This is my solution. I value privacy above all, and none of your data is being stored anywhere, QTweet only keeps records of what she needs to know (channel ids, twitter usernames, and that's about it), and doesn't record any personal information, nor does she even store a record of which tweets she forwards to your server. I am able to see which servers she's used in, for the purposes of debugging and contacting server owners.

## Todo List

- ~~Get actual support for text tweets, I'll do this if there's any interest at all from anyone to do it.~~
- ~~Notify users more precisely when there's a problem, mostly with permissions.~~
- ~~Better privilege control etc. Right now QTweet treats all users the same, except for the bot owner (you) who can bypass a few security things for debugging purposes.~~
- A !!like command to get a list of posts that you've liked in the past
- ~~Un-shortify twitter links~~
