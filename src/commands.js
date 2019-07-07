import * as config from "../config.json";
import usage from "./usage";
import log from "./log";

import * as checks from "./checks";
import {
  message as postMessage,
  embed as postEmbed,
  announcement
} from "./post";
import {
  rm,
  add,
  getUniqueChannels,
  getUserFromScreenName,
  rmChannel
} from "./subs";
import { compute as computeFlags } from "./flags";
import QChannel from "./QChannel";
import { formatChannelList, formatQChannel, formatTwitterUser } from "./format";
import {
  formatTweet,
  createStream,
  userTimeline,
  showTweet,
  userLookup,
  getError
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
      .then(async tweets => {
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
            log(`Stopped posting tweets after ${i}`, qChannel);
            break;
          }
        }
        log(`Posted latest ${count} tweet(s) from ${screenName}`, qChannel);
      })
      .catch(function(response) {
        const { code, msg } = getError(response);
        if (!code) {
          log("Exception thrown without error", qChannel);
          log(response, qChannel);
          postMessage(
            qChannel,
            `**Something went wrong getting tweets from ${screenName}**\nI'm looking into it, sorry for the trouble!`
          );
          return;
        } else {
          handleTwitterError(qChannel, code, msg, [screenName]);
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
      const { code, msg } = getError(response);
      if (!code) {
        log("Exception thrown without error", qChannel);
        log(response, qChannel);
        postMessage(
          qChannel,
          `**Something went wrong getting tweet #${id}**\nI'm looking into it, sorry for the trouble!`
        );
        return;
      } else {
        handleTwitterError(qChannel, code, msg, [id]);
      }
    });
};

const start = async (args, qChannel) => {
  let { values, options } = argParse(args);
  const flags = computeFlags(options);
  let screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postMessage(qChannel, usage["start"]);
    return;
  }
  const slices = 100;
  const totalScreenNames = screenNames.length;
  try {
    var data = [];
    while (screenNames.length > 0) {
      const res = await userLookup({
        screen_name: screenNames.slice(0, slices).toString()
      });
      data = data.concat(res);
      screenNames = screenNames.slice(slices);
    }
  } catch (res) {
    const { code, msg } = getError(res);
    if (!code) {
      log("Exception thrown without error", qChannel);
      log(res, qChannel);
      postMessage(
        qChannel,
        `**Something went wrong getting the info for ${
          screenNames.length === 1 ? "this account" : "these accounts"
        }**\nThe problem appears to be on my end, sorry for the trouble!`
      );
    } else {
      handleTwitterError(qChannel, code, msg, screenNames);
    }
    return;
  }
  const promises = [];
  data.forEach(({ id_str: userId, screen_name: name }) => {
    promises.push(add(qChannel.id, userId, name, flags, qChannel.isDM));
  });
  Promise.all(promises).then(results => {
    let addedObjectName = `@${data[0].screen_name}`;
    if (data.length > 1 && data.length < 10) {
      addedObjectName = `${data.length} users: ${data.reduce(
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
    } else if (data.length >= 10) {
      addedObjectName = `${data.length} twitter users`;
    }
    let channelMsg = `**You're now subscribed to ${addedObjectName}!**\nRemember you can stop me at any time with \`${
      config.prefix
    }stop ${
      data.length === 1 ? data[0].screen_name : "<screen_name>"
    }\`.\nIt can take up to 20min to start getting tweets from them, but once it starts, it'll be in real time!`;
    if (totalScreenNames !== data.length) {
      channelMsg += `\n\nIt also appears I was unable to find some of the users you specified, make sure you used their screen name!`;
    }
    postMessage(qChannel, channelMsg);
    log(`Added ${addedObjectName}`, qChannel);
    const redoStream = !!results.find(({ users }) => users !== 0);
    if (redoStream) createStream();
  });
};

const leaveGuild = async (args, qChannel) => {
  let guild = null;
  if (args.length >= 1 && qChannel.isDM) {
    guild = getGuild(args[0]);
  } else if (!qChannel.isDM) {
    guild = await qChannel.guild();
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
      if (qChannel.isDM) postMessage(qChannel, `Left the guild ${g}`);
    })
    .catch(err => {
      log("Could not leave guild", qChannel);
      log(err);
    });
};

const stop = (args, qChannel) => {
  const screenName = getScreenName(args[0]);
  userLookup({ screen_name: screenName })
    .then(async data => {
      let twitterId = data[0].id_str;
      const { subs } = await rm(qChannel.id, twitterId);
      if (subs === 0) {
        postMessage(
          qChannel,
          `**Not subscribed to @${screenName}**\nUse \`${
            config.prefix
          }list\` for a list of subscriptions!`
        );
      } else {
        postMessage(
          qChannel,
          `**I've unsubscribed you from @${screenName}**\nYou should stop getting any tweets from them.`
        );
      }
    })
    .catch(function(response) {
      const { code, msg } = getError(response);
      if (!code) {
        log("Exception thrown without error", qChannel);
        log(response, qChannel);
        postMessage(
          qChannel,
          `**Something went wrong trying to unsubscribe from ${screenName}**\nI'm looking into it, sorry for the trouble!`
        );
        return;
      } else {
        handleTwitterError(qChannel, code, msg, [screenName]);
      }
    });
};

const stopchannel = async (args, qChannel) => {
  let targetChannel = qChannel.id;
  let channelName = await qChannel.name();
  if (args.length > 0) {
    if (qChannel.isDM) {
      postMessage(
        qChannel,
        `**Use this command in the server you want to target**\nIn DMs, this command will affect your DM subscriptions so you don't have to use an argument`
      );
      return;
    }
    const guild = await qChannel.guild();
    targetChannel = args[0];
    const channelObj = guild.channels.find(c => c.id === targetChannel);
    if (!channelObj) {
      postMessage(
        qChannel,
        `**I couldn't find channel ${targetChannel} in your server.**\nIf you deleted it, I'll leave it by myself whenever I try to post there, don't worry!`
      );
      return;
    }
    channelName = await new QChannel(channelObj).name();
  }
  const { users } = await rmChannel(targetChannel);
  log(`Removed all gets from channel ID:${targetChannel}`, qChannel);
  postMessage(
    qChannel,
    `**I've unsubscribed you from ${users} users**\nYou should now stop getting any tweets in ${channelName}.`
  );
};

const list = (args, qChannel) => {
  formatChannelList(qChannel, qChannel);
};

const channelInfo = async (args, qChannel) => {
  const channelId = args.shift();
  if (!channelId) {
    postMessage(qChannel, "Usage: `!!admin c <id>`");
    return;
  }
  let qc = null;
  if (getChannel(channelId)) {
    qc = QChannel.unserialize({ channelId, isDM: false });
  } else {
    qc = QChannel.unserialize({ channelId, isDM: true });
  }
  if (!qc || !qc.id) {
    postMessage(
      qChannel,
      `I couldn't build a valid channel object with id: ${channelId}`
    );
    return;
  }
  let info = await formatQChannel(qc);
  postMessage(qChannel, info);
  formatChannelList(qChannel, qc);
};

const twitterInfo = async (args, qChannel) => {
  const screenName = args.shift();
  if (!screenName) {
    postMessage(qChannel, "Usage: `!!admin t <screenName>`");
    return;
  }
  const user = await getUserFromScreenName(screenName);
  if (!user) {
    postMessage(qChannel, `We're not getting any user called @${screenName}`);
    return;
  }
  formatTwitterUser(qChannel, user.twitterId);
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
  const channels = await getUniqueChannels();
  log(`Posting announcement to ${channels.length} channels`);
  announcement(msg, channels);
};

const handleTwitterError = (qChannel, code, msg, screenNames) => {
  if (code === 17) {
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
  } else if (code === 18) {
    log("Exceeded user lookup limit", qChannel);
    postMessage(
      qChannel,
      "**Too many users requested**\nIt seems I requested too many users to twitter. This shouldn't happen, but in the meantime try requesting fewer users!"
    );
  } else if (code === 34) {
    // Not found
    postMessage(
      qChannel,
      `**Invalid name: ${
        screenNames[0]
      }**\nMake sure you enter the screen name and not the display name.`
    );
  } else if (code === 144) {
    postMessage(
      qChannel,
      `**No such ID**\nTwitter says there's no tweet with this id!`
    );
  } else {
    log(`Unknown twitter error: ${code} ${msg}`);
    postMessage(
      qChannel,
      "**Oops!**\nSomething went wrong, I've never seen this error before. I'll do my best to fix it soon!"
    );
  }
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
