const config = require("./config.json");
const usage = require("./usage.js");
const checks = require("./checks");
const gets = require("./gets");
const post = require("./post");
const discord = require("./discord");
const twitter = require("./twitter");
const users = require("./users");
const log = require("./log");

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

const tweet = (args, channel) => {
  const screenName = getScreenName(args[0]);
  twitter
    .userTimeline({ screen_name: screenName })
    .then(function(tweets, error) {
      if (tweets.length < 1) {
        post.message(
          channel,
          "It doesn't look like " + screenName + " has any tweets... "
        );
        return;
      }
      let tweet = tweets[0];
      post.tweet(channel, tweet, true);
      log(`Posted latest tweet from ${screenName}`, channel);
    })
    .catch(function(error) {
      post.message(
        channel,
        "Something went wrong fetching this user's last tweet, sorry! :c"
      );
      log(`Couldn't get latest tweet from ${screenName}:`, channel);
      log(error, channel);
    });
};

const start = (args, channel) => {
  let options = users.defaultOptions();
  let screenName = null;
  for (let arg of args) {
    if (arg.substring(0, 2) == "--") {
      let option = arg.substring(2);
      if (option === "notext") options.text = false;
    } else if (screenName == null) {
      screenName = getScreenName(arg);
    } else {
      post.message(channel, "Invalid argument: " + arg);
      return;
    }
  }
  if (!screenName) {
    post.message(channel, usage["start"]);
    return;
  }
  twitter
    .userLookup({ screen_name: screenName })
    .then(function(data) {
      post.message(
        channel,
        "I'm starting to get tweets from " +
          screenName +
          ", remember you can stop me at any time with `" +
          config.prefix +
          "stop " +
          screenName +
          "`"
      );
      log(`Added ${screenName}`, channel);
      let userId = data[0].id_str;
      // Re-register the stream if we didn't know the user before
      let redoStream = !users.collection.hasOwnProperty(userId);
      gets.add(channel, userId, screenName, options);
      if (redoStream) {
        twitter.createStream();
      }
      users.save();
    })
    .catch(function(error) {
      post.message(
        channel,
        `I can't find a user by the name of ${screenName}, you most likely tried using their display name and not their twitter handle.`
      );
      return;
    });
};

const leaveGuild = (args, channel) => {
  let guild = null;
  if (args.length >= 1 && checks.isDm(null, channel)) {
    guild = discord.getGuild(args[0]);
  } else if (!checks.isDm(null, channel)) {
    guild = channel.guild;
  } else {
    post.message(channel, "No valid guild ID provided");
    return;
  }
  if (guild == undefined) {
    post.message(channel, "I couldn't find guild: " + args[0]);
    return;
  }
  // Leave the guild
  guild
    .leave()
    .then(g => {
      log(`Left the guild ${g.name}`);
      if (checks.isDm(author, channel))
        post.message(channel, `Left the guild ${g}`);
    })
    .catch(err => {
      log("Could not leave guild", channel);
      log(err);
    });
};

const stop = (args, channel) => {
  const screenName = getScreenName(args[0]);
  log(`Removed ${screenName}`, channel);
  gets.rm(channel, screenName);
};

const stopchannel = (args, channel) => {
  let targetChannel = null;
  if (args.length > 0) {
    targetChannel = args[0];
    if (!channel.guild.channels.find(c => c.id === targetChannel)) {
      post.message(
        channel,
        `I couldn't find channel ${targetChannel} in your server. If you deleted it, this is normal, don't panic, I'll try to leave it anyway :)`
      );
    }
  } else {
    targetChannel = channel.id;
  }
  const count = gets.rmChannel(targetChannel);
  log(`Removed all gets from channel ID:${targetChannel}`, channel);
  post.message(channel, `I have stopped fetching tweets from ${count} users`);
};

const list = (args, channel) => {
  users.list(channel);
};

const adminList = (args, channel) => {
  users.adminList(channel);
};

const announce = args => {
  const message = args.join(" ");
  const channels = [];
  Object.keys(users.collection).forEach(userId => {
    const user = users.collection[userId];
    user.channels.forEach(get => {
      if (!channels.find(channel => channel.guild.id === get.channel.guild.id))
        channels.push(get.channel);
    });
  });
  log(`Posting announcement to ${channels.length} channels`);
  post.announcement(message, channels);
};

module.exports = {
  start: {
    function: start,
    checks: [
      {
        f: checks.isMod,
        badB: `You're not authorized to start fetching tweets, you need to be a mod or to have the ${
          config.modRole
        } role!`
      },
      {
        f: checks.isNotDm,
        badB: "I can't post tweets automatically to DMs, I'm very sorry!"
      }
    ],
    minArgs: 1
  },
  stop: {
    function: stop,
    checks: [
      {
        f: checks.isMod,
        badB: "You're not authorized to stop fetching tweets!"
      },
      {
        f: checks.isNotDm,
        badB: "I can't post tweets automatically to DMs, I'm very sorry!"
      }
    ],
    minArgs: 1
  },
  list: {
    function: list,
    checks: [],
    minArgs: 0
  },
  adminlist: {
    function: adminList,
    checks: [
      {
        f: checks.isAdmin,
        badB: "Sorry, only my owner can use the adminlist command!"
      },
      {
        f: checks.isDm,
        badB: "For user privacy reasons, this command is only allowed in DMs."
      }
    ],
    minArgs: 0
  },
  tweet: {
    function: tweet,
    checks: [],
    minArgs: 1
  },
  stopchannel: {
    function: stopchannel,
    checks: [
      {
        f: checks.isMod,
        badB: `You're not authorized to start fetching tweets, you need to be a mod or to have the ${
          config.modRole
        } role!`
      },
      {
        f: checks.isNotDm,
        badB: "I can't post tweets automatically to DMs, I'm very sorry!"
      }
    ]
  },
  leaveguild: {
    function: leaveGuild,
    checks: [
      {
        f: checks.isAdmin,
        badB: "Sorry, only my owner can force me off a server"
      }
    ],
    minArgs: 0
  },
  announce: {
    function: announce,
    checks: [
      {
        f: checks.isAdmin,
        badB: "Sorry, only my owner can do announcements!"
      }
    ]
  }
};
