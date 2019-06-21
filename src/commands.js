import * as config from "../config.json";
import usage from "./usage";
import log from "./log";

import * as checks from "./checks";
import {
  message as postMessage,
  embed as postEmbed,
  announcement
} from "./post";
import { rm, add, rmChannel } from "./gets";
import * as users from "./users";
import QChannel from "./QChannel";
import { formatChannelList, formatQChannel, formatTwitterUser } from "./format";
import {
  formatTweet,
  createStream,
  userTimeline,
  showTweet,
  userLookup
} from "./twitter";
import { getGuild, getChannel } from "./discord";

const getScreenName = word => {
  if (word.startsWith("@")) {
    return word.substring(1);
  }
  const urlPrefix = "twitter.com/";
  if (word.indexOf(urlPrefix) !== -1) {
    const hasParameters = word.indexOf("?");
    return word.substring(
      word.indexOf(urlPrefix) + urlPrefix.length,
      hasParameters === -1 ? word.length : hasParameters
    );
  }
  return word;
};

const argParse = args => {
  let values = [];
  let options = [];
  for (let arg of args) {
    if (arg.substring(0, 2) == "--") {
      options.push(arg.substring(2));
    } else {
      values.push(arg);
    }
  }
  return { values, options };
};
const tweet = (args, qChannel, author) => {
  const { values, options } = argParse(args);
  let force = false;
  if (values.length < 1 || values.length > 2) {
    postMessage(qChannel, usage[tweet]);
    return;
  }
  const screenName = getScreenName(values[0]);
  options.forEach(option => {
    if (option === "force") {
      force = true;
    }
  });

  let count = 1;
  if (values.length > 1) {
    count = Number(values[1]);
  }
  if (isNaN(count)) {
    postMessage(
      qChannel,
      `**I need a number of tweets to get!**\nWait a minute, ${
        args[1]
      } isn't a number! >:c`
    );
    return;
  }
  const maxCount = 5;
  const aLot = 15;
  checks.isMod(author, qChannel, isMod => {
    if (!isMod && count > maxCount) {
      postMessage(
        qChannel,
        `**Limited to ${maxCount} tweets**\nYou're not a mod so I have to limit you - here's the latest ${maxCount} tweets!`
      );
      count = maxCount;
    }
    if (count < 1) {
      postMessage(
        qChannel,
        `**You asked me to post ${count} tweets, so I won't post any**\nNice try~`
      );
      return;
    }
    if (count >= aLot && !force) {
      log("Asked user to confirm", qChannel);
      postMessage(
        qChannel,
        `**You're asking for a lot of tweets**\nAre you sure you want me to post ${count} tweets? Once I start, you won't be able to stop me!\n If you're sure you want me to do it, run:\n\`${
          config.prefix
        }tweet ${screenName} ${count} --force\``
      );
      return;
    }
    userTimeline({ screen_name: screenName, tweet_mode: "extended", count })
      .then(async (tweets, error) => {
        if (tweets.error) {
          if (tweets.error === "Not authorized.") {
            postMessage(
              qChannel,
              `**I tried getting a tweet from ${screenName} but Twitter tells me that's unauthorized.**\nThis is usually caused by a blocked account.`
            );
          } else {
            postMessage(
              qChannel,
              `**${screenName} does exist but something seems wrong with their profile**\nI can't get their timeline... Twitter had this to say:\n${
                tweets.error
              }`
            );
            log("Unknown error on twitter timeline", qChannel);
            log(tweets.error, qChannel);
          }
          return;
        }
        if (tweets.length < 1) {
          postMessage(
            qChannel,
            "It doesn't look like " + screenName + " has any tweets... "
          );
          return;
        }
        let validTweets = tweets.filter(t => t && t.user);
        if (validTweets.length == 0) {
          postMessage(
            qChannel,
            "**This user doesn't seem to have any valid tweets**\nYou might want to try again, maybe Twitter messed up?"
          );
          log("Invalid tweets from timeline", qChannel);
          log(tweets, qChannel);
          return;
        }
        for (let i = 0; i < validTweets.length; i++) {
          const { embed } = formatTweet(validTweets[i]);
          const res = await postEmbed(qChannel, embed);
          if (res) {
            log(`Stopped posting tweets after ${i}`);
            break;
          }
        }
        log(`Posted latest ${count} tweet(s) from ${screenName}`, qChannel);
      })
      .catch(function(response) {
        const err =
          response &&
          response.errors &&
          response.errors.length > 0 &&
          response.errors[0];
        if (!err) {
          log("Exception thrown without error", qChannel);
          log(response, qChannel);
          postMessage(
            qChannel,
            `**Something went wrong getting tweets from ${screenName}**\nI'm looking into it, sorry for the trouble!`
          );
          return;
        }
        const { code, msg } = err;
        if (code === 34)
          // Not found
          postMessage(
            qChannel,
            `**Twitter tells me @${screenName} doesn't exist!**\nMake sure you enter the screen name and not the display name.`
          );
        else {
          postMessage(
            qChannel,
            `**There was a problem getting @${screenName}'s latest tweet**\nIt's possible Twitter is temporarily down.\nTwitter had this to say: \`${msg}\``
          );
          log(
            `Couldn't get latest tweet from ${screenName}, user input was ${
              args[0]
            }:`,
            qChannel
          );
          log(response, qChannel);
        }
      });
  });
};

const tweetId = (args, qChannel) => {
  const id = args[0];
  showTweet(id, { tweet_mode: "extended" })
    .then((tweet, error) => {
      if (error) {
        log(error, qChannel);
        return;
      }

      const { embed } = formatTweet(tweet);
      postEmbed(qChannel, embed);
      log(`Posting tweet ${id}`, qChannel);

      if (tweet.quoted_status && tweet.quoted_status.user) {
        const { embed: quotedEmbed } = formatTweet(tweet);
        postEmbed(qChannel, quotedEmbed);
      }
    })
    .catch(response => {
      const err =
        response &&
        response.errors &&
        response.errors.length > 0 &&
        response.errors[0];
      log(response, qChannel);
      postMessage(qChannel, `${err}`);
    });
};

const start = (args, qChannel) => {
  let { values, options } = argParse(args);
  const flags = users.computeFlags(options);
  const screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postMessage(qChannel, usage["start"]);
    return;
  }
  userLookup({ screen_name: screenNames.toString() })
    .then(function(data) {
      let redoStream = false;
      const addedObjectName =
        data.length === 1
          ? `${data[0].screen_name}`
          : `${data.length} users: ${data.reduce(
              (acc, { screen_name }, idx) => {
                if (idx === data.length - 1) {
                  return acc.concat(` and ${screen_name}`);
                } else if (idx === 0) {
                  return screen_name;
                }
                return acc.concat(`, ${screen_name}`);
              },
              ""
            )}`;
      data.forEach(({ id_str: userId, screen_name: name }) => {
        if (!redoStream && !users.collection.hasOwnProperty(userId)) {
          redoStream = true;
        }
        add(qChannel, userId, name, flags);
      });
      let channelMsg = `**You're now subscribed to ${addedObjectName}!**\nRemember you can stop me at any time with \`${
        config.prefix
      }stop ${
        data.length === 1 ? data[0].screen_name : "<screen_name>"
      }\`.\nIt can take up to 20min to start getting tweets from them, but once it starts, it'll be in real time!`;
      if (screenNames.length !== data.length) {
        channelMsg += `\n\nIt also appears I was unable to find some of the users you specified, make sure you used their screen name!`;
      }
      postMessage(qChannel, channelMsg);
      log(`Added ${addedObjectName}`, qChannel);
      // Re-register the stream if we didn't know the user before
      if (redoStream) {
        createStream();
      }
      users.save();
    })
    .catch(function(error) {
      if (screenNames.length === 1) {
        postMessage(
          qChannel,
          `**I can't find a user by the name of ${
            screenNames[0]
          }**\nYou most likely tried using their display name and not their twitter handle.`
        );
      } else {
        postMessage(
          qChannel,
          `**I can't find any of those users:** ${screenNames.toString()}\nYou most likely tried using their display names and not their twitter handles.`
        );
      }
      return;
    });
};

const leaveGuild = (args, qChannel) => {
  let guild = null;
  if (args.length >= 1 && checks.isDm(null, qChannel)) {
    guild = getGuild(args[0]);
  } else if (!checks.isDm(null, qChannel)) {
    guild = qChannel.guild();
  } else {
    postMessage(qChannel, "No valid guild ID provided");
    return;
  }
  if (guild == undefined) {
    postMessage(qChannel, "I couldn't find guild: " + args[0]);
    return;
  }
  // Leave the guild
  guild
    .leave()
    .then(g => {
      log(`Left the guild ${g.name}`);
      if (checks.isDm(null, qChannel))
        postMessage(qChannel, `Left the guild ${g}`);
    })
    .catch(err => {
      log("Could not leave guild", qChannel);
      log(err);
    });
};

const stop = (args, qChannel) => {
  const screenName = getScreenName(args[0]);
  log(`Removed ${screenName}`, qChannel);
  rm(qChannel, screenName);
};

const stopchannel = (args, qChannel) => {
  const targetChannel = qChannel.id;
  let channelName = qChannel.name;
  if (args.length > 0 && qChannel.type !== "dm") {
    const channelObj = qChannel
      .guild()
      .channels.find(c => c.id === targetChannel);
    if (!channelObj) {
      postMessage(
        qChannel,
        `**I couldn't find channel ${targetChannel} in your server.**\nIf you deleted it, I'll leave it by myself whenever I try to post there, don't worry!`
      );
      return;
    }
    channelName = new QChannel(channelObj).name;
  }
  const count = rmChannel(targetChannel);
  log(`Removed all gets from channel ID:${targetChannel}`, qChannel);
  postMessage(
    qChannel,
    `**I've unsubscribed you from ${count} users**\nYou should now stop getting any tweets in ${channelName}.`
  );
};

const list = (args, qChannel) => {
  formatChannelList(qChannel, qChannel);
};

const channelInfo = async (args, qChannel) => {
  const id = args.shift();
  if (!id) {
    postMessage(qChannel, "Usage: `!!admin c <id>`");
    return;
  }
  let qc = null;
  if (getChannel(id)) {
    qc = await QChannel.unserialize({ id, isDM: false });
  } else {
    qc = await QChannel.unserialize({ id, isDM: true });
  }
  if (!qc || !qc.id) {
    postMessage(
      qChannel,
      `I couldn't build a valid channel object with id: ${id}`
    );
    return;
  }
  let info = await formatQChannel(qc);
  postMessage(qChannel, info);
  formatChannelList(qChannel, qc);
};

const twitterInfo = (args, qChannel) => {
  const screenName = args.shift();
  if (!screenName) {
    postMessage(qChannel, "Usage: `!!admin t <screenName>`");
    return;
  }
  const id = users.getTwitterIdFromScreenName(screenName);
  if (!id) {
    postMessage(qChannel, `We're not getting any user called @${screenName}`);
    return;
  }
  formatTwitterUser(qChannel, id);
};

const admin = (args, qChannel) => {
  const verb = args.shift();
  switch (verb[0]) {
    case "c":
      channelInfo(args, qChannel);
      return;
    case "t":
      twitterInfo(args, qChannel);
      return;
    default: {
      postMessage(
        qChannel,
        `**admin command failed**\nInvalid verb: ${verb}\n`
      );
    }
  }
};

const announce = async args => {
  const msg = args.join(" ");
  const qChannels = await users.getUniqueChannels();
  log(`Posting announcement to ${qChannels.length} channels`);
  announcement(msg, qChannels);
};

export default {
  start: {
    function: start,
    checks: [
      {
        f: checks.isMod,
        badB: `**Not authorized**\nTo subscribe to a twitter account you need to be a moderator or to have the ${
          config.modRole
        } role!`
      }
    ],
    minArgs: 1
  },
  stop: {
    function: stop,
    checks: [
      {
        f: checks.isMod,
        badB:
          "**Not authorized**\nOnly moderators can unsubscribe from a twitter account!"
      }
    ],
    minArgs: 1
  },
  list: {
    function: list,
    checks: [],
    minArgs: 0
  },
  admin: {
    function: admin,
    checks: [
      {
        f: checks.isAdmin,
        badB:
          "**Bot Owner command**\nThis command accesses other servers' data so only my owner can use it!"
      },
      {
        f: checks.isDm,
        badB: "For user privacy reasons, this command is only allowed in DMs."
      }
    ],
    minArgs: 1
  },
  tweet: {
    function: tweet,
    checks: [],
    minArgs: 1
  },
  tweetid: {
    function: tweetId,
    checks: [],
    minArgs: 1
  },
  stopchannel: {
    function: stopchannel,
    checks: [
      {
        f: checks.isMod,
        badB:
          "**Not authorized**\nOnly moderators can unsubscribe from a twitter account!"
      }
    ]
  },
  leaveguild: {
    function: leaveGuild,
    checks: [
      {
        f: checks.isAdmin,
        badB:
          "**Bot Owner command**\nSorry, only my owner can force me off a server"
      }
    ],
    minArgs: 0
  },
  announce: {
    function: announce,
    checks: [
      {
        f: checks.isAdmin,
        badB:
          "**Bot Owner command**\nSorry, only my owner can do announcements!"
      }
    ]
  }
};
