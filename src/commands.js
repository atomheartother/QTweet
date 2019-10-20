import log from "./log";
import { RichEmbed } from "discord.js";

import * as checks from "./checks";
import {
  message as postMessage,
  embed as postEmbed,
  announcement,
  translated as postTranslated
} from "./post";
import {
  rm,
  add,
  getUniqueChannels,
  getUserFromScreenName,
  rmChannel,
  getChannelSubs,
  getGuildSubs,
  setLang,
  getLang,
  getUserIds
} from "./subs";
import { compute as computeFlags } from "./flags";
import QChannel from "./QChannel";
import { supportedLangs, prefix, profileURL } from "../config.json";

import {
  formatSubsList,
  formatQChannel,
  formatTwitterUser,
  formatLanguages
} from "./format";
import {
  formatTweet,
  createStream,
  userTimeline,
  showTweet,
  userLookup,
  getError
} from "./twitter";
import { getGuild, getChannel } from "./discord";
import i18n from "./i18n";

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
  const values = [];
  const flags = [];
  const options = {};
  for (let arg of args) {
    if (arg.substring(0, 2) == "--") {
      const optStr = arg.substring(2);
      const equalIdx = optStr.indexOf("=");
      if (equalIdx === -1) flags.push(arg.substring(2));
      // flag
      else if (equalIdx > 0) {
        options[optStr.substring(0, equalIdx)] = optStr.substring(equalIdx + 1);
      }
    } else {
      values.push(arg);
    }
  }
  return { values, flags, options };
};

const postTimeline = async (qChannel, screenName, count) =>
  new Promise(resolve =>
    userTimeline({ screen_name: screenName, tweet_mode: "extended", count })
      .then(async tweets => {
        if (tweets.error) {
          if (tweets.error === "Not authorized.") {
            postTranslated(qChannel, "tweetNotAuthorized", { screenName });
          } else {
            postTranslated(qChannel, "tweetUnknwnError", {
              error: tweets.error,
              screenName
            });
            log("Unknown error on twitter timeline", qChannel);
            log(tweets.error, qChannel);
          }
          return resolve(0);
        }
        if (tweets.length < 1) {
          postTranslated(qChannel, "noTweets", { screenName });
          return resolve(0);
        }
        let validTweets = tweets.filter(t => t && t.user);
        if (validTweets.length == 0) {
          postTranslated(qChannel, "noValidTweets");
          log("Invalid tweets from timeline", qChannel);
          log(tweets, qChannel);
          return resolve(0);
        }
        for (let i = 0; i < validTweets.length; i++) {
          const { embed } = await formatTweet(validTweets[i]);
          const res = await postEmbed(qChannel, embed);
          if (res) {
            log(`Stopped posting tweets after ${i}`, qChannel);
            return resolve(i);
          }
        }
        log(
          `Posted latest ${validTweets.length} tweet(s) from ${screenName}`,
          qChannel
        );
        resolve(validTweets.length);
      })
      .catch(function(response) {
        const { code, msg } = getError(response);
        if (!code) {
          log("Exception thrown without error", qChannel);
          log(response, qChannel);
          postTranslated(qChannel, "tweetGeneralError", { screenName });
        } else {
          handleTwitterError(qChannel, code, msg, [screenName]);
        }
        resolve(0);
      })
  );

const tweet = async (args, qChannel, author) => {
  const { values, flags, options } = argParse(args);
  let force = false;
  if (values.length < 1) {
    postTranslated(qChannel, "usage-tweet");
    return;
  }
  let screenNames = values.map(name => getScreenName(name));
  if (flags.indexOf("force") !== -1) force = true;
  const isMod = await checks.isMod(author, qChannel);
  let count = options.count ? Number(options.count) : 1;
  if (!count || isNaN(count)) {
    postTranslated(qChannel, "countIsNaN", { count: options.count });
    return;
  }
  const maxCount = 5;
  const aLot = 15;
  if (!isMod && count * screenNames.length > maxCount) {
    if (screenNames.length === 1) count = maxCount;
    else {
      screenNames = screenNames.slice(0, maxCount);
      count = Math.floor(maxCount / screenNames.length);
    }
    postTranslated(qChannel, "tweetCountLimited", {
      maxCount: count * screenNames.length
    });
  }
  if (count < 1) {
    postTranslated(qChannel, "tweetCountUnderOne", { count });
    return;
  }
  if (count * screenNames.length >= aLot && !force) {
    log("Asked user to confirm", qChannel);
    postTranslated(qChannel, "tweetCountHighConfirm", {
      screenName: screenNames.join(" "),
      count
    });
    return;
  }
  for (let i = 0; i < screenNames.length; i++) {
    const posts = await postTimeline(qChannel, screenNames[i], count);
    if (posts < 1) return;
  }
};

const tweetId = (args, qChannel) => {
  const id = args[0];
  showTweet(id, { tweet_mode: "extended" })
    .then(async (tweet, error) => {
      if (error) {
        log(error, qChannel);
        return;
      }

      const { embed } = await formatTweet(tweet);
      postEmbed(qChannel, embed);
      log(`Posting tweet ${id}`, qChannel);

      if (tweet.quoted_status && tweet.quoted_status.user) {
        const { embed: quotedEmbed } = await formatTweet(tweet);
        postEmbed(qChannel, quotedEmbed);
      }
    })
    .catch(response => {
      const { code, msg } = getError(response);
      if (!code) {
        log("Exception thrown without error", qChannel);
        log(response, qChannel);
        postTranslated(qChannel, "tweetIdGeneralError", { id });
        return;
      } else {
        handleTwitterError(qChannel, code, msg, [id]);
      }
    });
};

const start = async (args, qChannel) => {
  let { values, flags: strFlags } = argParse(args);
  const flags = computeFlags(strFlags);
  let screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postTranslated(qChannel, "usage-start");
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
      postTranslated(qChannel, "startGeneralError", {
        namesCount: screenNames.length
      });
    } else {
      handleTwitterError(qChannel, code, msg, screenNames);
    }
    return;
  }
  const allUserIds = await getUserIds();
  if (allUserIds.length + data.length >= 5000) {
    // Filter out users which would be new users
    const filteredData = allUserIds.reduce((acc, { twitterId }) => {
      const idx = data.findIndex(({ id_str: userId }) => {
        userId === twitterId;
      });
      if (idx === -1) return acc;
      return acc.concat([data[idx]]);
    }, []);
    if (filteredData.length !== data.length) {
      postTranslated(qChannel, "userLimit");
    }
    if (filteredData.length <= 0) {
      return;
    }
    data = filteredData;
  }
  const promises = data.map(({ id_str: userId, screen_name: name }) =>
    add(qChannel.id, userId, name, flags, qChannel.isDM)
  );
  Promise.all(promises).then(async results => {
    const screenNamesFinal = data.map(user => `@${user.screen_name}`);
    const nameCount = screenNamesFinal.length;
    const lastName = screenNamesFinal.pop();
    const addedObjectName = i18n(
      await getLang(qChannel.guildId()),
      "formatUserNames",
      {
        count: nameCount,
        names: screenNamesFinal.toString(),
        lastName
      }
    );
    if (results.find(({ subs }) => subs !== 0))
      postTranslated(qChannel, "startSuccess", {
        addedObjectName,
        nameCount,
        firstName: lastName,
        missedNames: totalScreenNames !== nameCount ? 1 : 0
      });
    else
      postTranslated(qChannel, "startUpdateSuccess", {
        addedObjectName
      });
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
    postTranslated(qChannel, "noValidGid");
    return;
  }
  if (guild == undefined) {
    postTranslated(qChannel, "guildNotFound", { guild: args[0] });
    return;
  }
  // Leave the guild
  guild
    .leave()
    .then(g => {
      log(`Left the guild ${g.name}`);
      if (qChannel.isDM)
        postTranslated(qChannel, "leaveSuccess", { name: guild.name });
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
      const { subs, users } = await rm(qChannel.id, twitterId);
      if (subs === 0) {
        postTranslated(qChannel, "noSuchSubscription", { screenName });
      } else {
        postTranslated(qChannel, "stopSuccess", { screenName });
        if (users > 0) createStream();
      }
    })
    .catch(function(response) {
      const { code, msg } = getError(response);
      if (!code) {
        log("Exception thrown without error", qChannel);
        log(response, qChannel);
        postTranslated(qChannel, "stopGeneralError", { screenName });
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
      postTranslated(qChannel, "stopChannelInDm");
      return;
    }
    const guild = await qChannel.guild();
    targetChannel = args[0];
    const channelObj = guild.channels.find(c => c.id === targetChannel);
    if (!channelObj) {
      postTranslated(qChannel, "noSuchChannel", { targetChannel });
      return;
    }
    channelName = await new QChannel(channelObj).name();
  }
  const { subs } = await rmChannel(targetChannel);
  log(
    `Removed all gets from channel ID:${targetChannel}. ${subs} subs removed.`,
    qChannel
  );
  postTranslated(qChannel, "stopChannelSuccess", { subs, channelName });
};

const list = async (args, qChannel) => {
  const subs = await getChannelSubs(qChannel.id, true);
  formatSubsList(qChannel, subs);
};

const channelInfo = async (args, qChannel) => {
  const channelId = args.shift();
  if (!channelId) {
    postTranslated(qChannel, "usage-admin-channel");
    return;
  }
  let qc = null;
  if (getChannel(channelId)) {
    qc = QChannel.unserialize({ channelId, isDM: false });
  } else {
    qc = QChannel.unserialize({ channelId, isDM: true });
  }
  if (!qc || !(await qc.obj())) {
    postTranslated(qChannel, "adminInvalidId", { channelId });
    return;
  }
  let info = await formatQChannel(qc);
  postMessage(qChannel, info);
  const subs = await getChannelSubs(qc.id, true);
  formatSubsList(qChannel, subs);
};

const twitterInfo = async (args, qChannel) => {
  const screenName = args.shift();
  if (!screenName) {
    postTranslated(qChannel, "usage-admin-twitter");
    return;
  }
  const user = await getUserFromScreenName(screenName);
  if (!user) {
    postTranslated(qChannel, "adminInvalidTwitter", { screenName });
    return;
  }
  formatTwitterUser(qChannel, user.twitterId);
};

const lang = async (args, qChannel) => {
  const verb = args.shift();
  switch (verb[0]) {
    case "l":
      formatLanguages(qChannel, supportedLangs);
      break;
    case "s": {
      const language = args.shift();
      if (!language) {
        postTranslated(qChannel, "usage-lang-set");
        return;
      }
      if (supportedLangs.indexOf(language) === -1) {
        postTranslated(qChannel, "noSuchLang", { language });
        return;
      }
      await setLang(qChannel.guildId(), language);
      postTranslated(qChannel, "langSuccess");
      log(`Changed language to ${language}`, qChannel);
      break;
    }
    default:
      postTranslated(qChannel, "invalidVerb", { verb });
  }
};

const guildInfo = async (args, qChannel) => {
  const gid = args.shift();
  if (!gid) {
    postTranslated(qChannel, "usage-admin-guild");
    return;
  }
  const subs = await getGuildSubs(gid);
  formatSubsList(qChannel, subs);
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
    case "g":
      guildInfo(args, qChannel);
      return;
    default: {
      postTranslated(qChannel, "invalidVerb", { verb });
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
  if (code === 17 || code === 34) {
    postTranslated(qChannel, "noSuchTwitterUser", {
      count: screenNames.length,
      name: screenNames.toString()
    });
  } else if (code === 18) {
    log("Exceeded user lookup limit", qChannel);
    postTranslated(qChannel, "tooManyUsersRequested");
  } else if (code === 144) {
    postTranslated(qChannel, "noSuchTwitterId");
  } else {
    log(`Unknown twitter error: ${code} ${msg}`);
    postTranslated(qChannel, "twitterUnknwnError");
  }
};

const help = async (args, qChannel) => {
  const lang = await getLang(qChannel.guildId());
  const embed = new RichEmbed()
    .setColor(0x0e7675)
    .setTitle(i18n(lang, "helpHeader"))
    .setURL(profileURL)
    .setDescription(i18n(lang, "helpIntro"))
    .addField(`${prefix}tweet`, i18n(lang, "usage-tweet"))
    .addField(`${prefix}start`, i18n(lang, "usage-start"))
    .addField(`${prefix}stop`, i18n(lang, "usage-stop"))
    .addField(`${prefix}lang`, i18n(lang, "usage-lang"))
    .addField(`${prefix}list`, i18n(lang, "usage-list"))
    .setFooter(i18n(lang, "helpFooter", { artist: "ryusukehamamoto" }));
  postEmbed(qChannel, { embed });
};

export default {
  start: {
    function: start,
    checks: [
      {
        f: checks.isMod,
        badB: "startForMods"
      }
    ],
    minArgs: 1
  },
  lang: {
    function: lang,
    checks: [
      {
        f: checks.isMod,
        badB: "langForMods"
      }
    ],
    minArgs: 1
  },
  stop: {
    function: stop,
    checks: [
      {
        f: checks.isMod,
        badB: "stopForMods"
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
        badB: "adminForAdmin"
      },
      {
        f: checks.isDm,
        badB: "cmdInDms"
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
        badB: "stopForMods"
      }
    ]
  },
  help: {
    function: help,
    checks: [],
    minArgs: 0
  },
  leaveguild: {
    function: leaveGuild,
    checks: [
      {
        f: checks.isAdmin,
        badB: "leaveForAdmin"
      }
    ],
    minArgs: 0
  },
  announce: {
    function: announce,
    checks: [
      {
        f: checks.isAdmin,
        badB: "announceForAdmin"
      }
    ]
  }
};
