import { RichEmbed } from 'discord.js';
import log from './log';

import * as checks from './checks';
import {
  message as postMessage,
  embed as postEmbed,
  announcement,
  translated as postTranslated,
} from './post';
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
  getUserIds as getAllSubs,
  rmGuild,
} from './subs';
import { compute as computeFlags } from './flags';
import QChannel from './QChannel';
import { supportedLangs, profileURL } from '../config.json';

import {
  formatSubsList,
  formatQChannel,
  formatTwitterUser,
  formatLanguages,
} from './format';
import {
  formatTweet,
  createStream,
  userTimeline,
  showTweet,
  userLookup,
  getError,
} from './twitter';
import { getGuild, getChannel } from './discord';
import i18n from './i18n';


const getScreenName = (word) => {
  if (word.startsWith('@')) {
    return word.substring(1);
  }
  const urlPrefix = 'twitter.com/';
  if (word.indexOf(urlPrefix) !== -1) {
    const hasParameters = word.indexOf('?');
    return word.substring(
      word.indexOf(urlPrefix) + urlPrefix.length,
      hasParameters === -1 ? word.length : hasParameters,
    );
  }
  return word;
};

const argParse = (args) => {
  const values = [];
  const flags = [];
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.substring(0, 2) === '--') {
      const optStr = arg.substring(2);
      const equalIdx = optStr.indexOf('=');
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

const handleTwitterError = (qChannel, code, msg, screenNames) => {
  if (code === 17 || code === 34) {
    postTranslated(qChannel, 'noSuchTwitterUser', {
      count: screenNames.length,
      name: screenNames.toString(),
    });
  } else if (code === 18) {
    log('Exceeded user lookup limit', qChannel);
    postTranslated(qChannel, 'tooManyUsersRequested');
  } else if (code === 144) {
    postTranslated(qChannel, 'noSuchTwitterId');
  } else {
    log(`Unknown twitter error: ${code} ${msg}`);
    postTranslated(qChannel, 'twitterUnknwnError');
  }
};

const postTimeline = async (qChannel, screenName, count) => {
  let tweets = [];
  try {
    tweets = await userTimeline({ screen_name: screenName, tweet_mode: 'extended', count });
  } catch (response) {
    const { code, msg } = getError(response);
    if (!code) {
      log('Exception thrown without error', qChannel);
      log(response, qChannel);
      postTranslated(qChannel, 'tweetGeneralError', { screenName });
    } else {
      handleTwitterError(qChannel, code, msg, [screenName]);
    }
    return 0;
  }
  if (tweets.error) {
    if (tweets.error === 'Not authorized.') {
      postTranslated(qChannel, 'tweetNotAuthorized', { screenName });
    } else {
      postTranslated(qChannel, 'tweetUnknwnError', {
        error: tweets.error,
        screenName,
      });
      log('Unknown error on twitter timeline', qChannel);
      log(tweets.error, qChannel);
    }
    return 0;
  }
  if (tweets.length < 1) {
    postTranslated(qChannel, 'noTweets', { screenName });
    return 0;
  }
  const validTweets = tweets.filter((t) => t && t.user);
  if (validTweets.length === 0) {
    postTranslated(qChannel, 'noValidTweets');
    log('Invalid tweets from timeline', qChannel);
    log(tweets, qChannel);
    return 0;
  }
  const formattedTweets = await Promise.all(validTweets.map(formatTweet));
  // Ignore errors to get a count of successful posts
  const results = await Promise.all(formattedTweets.map(({
    embed,
  }) => postEmbed(qChannel, embed).catch((err) => err)));
  const successCount = results.reduce((acc, res) => {
    if (Number.isNaN(res)) return acc;
    return res === 0 ? acc + 1 : acc;
  }, 0);
  log(
    `Posted latest ${successCount}/${validTweets.length} tweet(s) from ${screenName}`,
    qChannel,
  );
  return successCount;
};

const tweet = async (args, qChannel, author) => {
  const { values, flags, options } = argParse(args);
  let force = false;
  if (values.length < 1) {
    postTranslated(qChannel, 'usage-tweet');
    return;
  }
  let screenNames = values.map((name) => getScreenName(name));
  if (flags.indexOf('force') !== -1) force = true;
  const isMod = await checks.isMod(author, qChannel);
  let count = options.count ? Number(options.count) : 1;
  if (!count || Number.isNaN(count)) {
    postTranslated(qChannel, 'countIsNaN', { count: options.count });
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
    postTranslated(qChannel, 'tweetCountLimited', {
      maxCount: count * screenNames.length,
    });
  }
  if (count < 1) {
    postTranslated(qChannel, 'tweetCountUnderOne', { count });
    return;
  }
  if (count * screenNames.length >= aLot && !force) {
    log('Asked user to confirm', qChannel);
    postTranslated(qChannel, 'tweetCountHighConfirm', {
      screenName: screenNames.join(' '),
      count,
    });
    return;
  }
  await Promise.all(screenNames.map((screenName) => postTimeline(qChannel, screenName, count)));
};

const tweetId = (args, qChannel) => {
  const id = args[0];
  showTweet(id, { tweet_mode: 'extended' })
    .then(async (tweetData, error) => {
      if (error) {
        log(error, qChannel);
        return;
      }

      const { embed } = await formatTweet(tweetData);
      postEmbed(qChannel, embed);
      log(`Posting tweet ${id}`, qChannel);

      if (tweetData.quoted_status && tweetData.quoted_status.user) {
        const { embed: quotedEmbed } = await formatTweet(tweetData);
        postEmbed(qChannel, quotedEmbed);
      }
    })
    .catch((response) => {
      const { code, msg } = getError(response);
      if (!code) {
        log('Exception thrown without error', qChannel);
        log(response, qChannel);
        postTranslated(qChannel, 'tweetIdGeneralError', { id });
      } else {
        handleTwitterError(qChannel, code, msg, [id]);
      }
    });
};

const getUserIds = async (screenNames) => {
  const chunks = 100;
  const promises = [];
  for (let i = 0; i < screenNames.length; i += chunks) {
    promises.push(userLookup({
      screen_name: screenNames.slice(i, i + chunks).toString(),
    }));
  }
  const arrays = await Promise.all(promises);
  return [].concat(...arrays);
};

// This changes screenNames.
const formatScreenNames = async (qChannel, screenNames, lastName) => i18n(await getLang(qChannel.guildId()), 'formatUserNames', {
  count: screenNames.length + 1,
  names: screenNames.toString(),
  lastName,
});

const start = async (args, qChannel) => {
  const { values, flags: strFlags } = argParse(args);
  const flags = computeFlags(strFlags);
  const screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postTranslated(qChannel, 'usage-start');
    return;
  }
  let data = [];
  try {
    data = await getUserIds(screenNames);
  } catch (res) {
    const { code, msg } = getError(res);
    if (!code) {
      log('Exception thrown without error', qChannel);
      log(res, qChannel);
      postTranslated(qChannel, 'startGeneralError', {
        namesCount: screenNames.length,
      });
    } else {
      handleTwitterError(qChannel, code, msg, screenNames);
    }
    return;
  }
  const allUserIds = await getAllSubs();
  if (allUserIds.length + data.length >= 5000) {
    // Filter out users which would be new users
    const filteredData = allUserIds.reduce((acc, { twitterId }) => {
      const idx = data.findIndex(({ id_str: userId }) => userId === twitterId);
      if (idx === -1) return acc;
      return acc.concat([data[idx]]);
    }, []);
    // If we've had to drop users, display a message
    if (filteredData.length !== data.length) {
      postTranslated(qChannel, 'userLimit');
    }
    // If all users were new users, we're done.
    if (filteredData.length <= 0) {
      return;
    }
    data = filteredData;
  }
  const promises = data.map(({
    id_str: userId,
    screen_name: name,
  }) => add(qChannel.id, userId, name, flags, qChannel.isDM));
  const screenNamesFinal = data.map(({
    screen_name: screenName,
  }) => `@${screenName}`);
  const nameCount = screenNamesFinal.length;
  const lastName = screenNamesFinal.pop();
  const addedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  const results = await Promise.all(promises);
  if (results.find(({ subs }) => subs !== 0)) {
    postTranslated(qChannel, 'startSuccess', {
      addedObjectName,
      nameCount,
      firstName: lastName,
      missedNames: screenNames.length !== nameCount ? 1 : 0,
    });
  } else {
    postTranslated(qChannel, 'startUpdateSuccess', {
      addedObjectName,
    });
  }
  log(`Added ${addedObjectName}`, qChannel);
  const redoStream = !!results.find(({ users }) => users !== 0);
  if (redoStream) createStream();
};

const leaveGuild = async (args, qChannel) => {
  let guild = null;
  if (args.length >= 1 && qChannel.isDM) {
    guild = getGuild(args[0]);
  } else if (!qChannel.isDM) {
    guild = await qChannel.guild();
  } else {
    postTranslated(qChannel, 'noValidGid');
    return;
  }
  if (guild === undefined) {
    postTranslated(qChannel, 'guildNotFound', { guild: args[0] });
    return;
  }
  // Leave the guild
  try {
    const g = await guild.leave();
    const { channels, users } = await rmGuild(g.id);
    log(`Left the guild ${g.name} (${g.id}). Deleted ${channels} channels, ${users} users.`);
    if (qChannel.isDM) postTranslated(qChannel, 'leaveSuccess', { name: guild.name });
  } catch (err) {
    log('Could not leave guild', qChannel);
    log(err);
  }
};

const stop = async (args, qChannel) => {
  const { values } = argParse(args);
  const screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postTranslated(qChannel, 'usage-stop');
    return;
  }
  let data = [];
  try {
    data = await getUserIds(screenNames);
  } catch (response) {
    const { code, msg } = getError(response);
    if (!code) {
      log('Exception thrown without error', qChannel);
      log(response, qChannel);
      postTranslated(qChannel, 'getInfoGeneralError', {
        namesCount: screenNames.length,
      });
      return;
    }
    handleTwitterError(qChannel, code, msg, screenNames);

    return;
  }
  const promises = data.map(({ id_str: userId }) => rm(qChannel.id, userId));

  const results = await Promise.all(promises);
  const screenNamesFinal = data.map(({ screen_name: screenName }) => `@${screenName}`);
  const lastName = screenNamesFinal.pop();
  const removedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  const { users, subs } = results.reduce(
    (acc, { subs: removedSubs, users: removedUsers }) => ({
      subs: acc.subs + removedSubs,
      users: acc.users + removedUsers,
    }),
    { users: 0, subs: 0 },
  );
  if (subs === 0) {
    postTranslated(qChannel, 'noSuchSubscription', { screenNames: removedObjectName });
  } else {
    postTranslated(qChannel, 'stopSuccess', {
      screenNames: removedObjectName,
    });
    if (users > 0) createStream();
  }
};

const stopchannel = async (args, qChannel) => {
  let targetChannel = qChannel.id;
  let channelName = await qChannel.name();
  if (args.length > 0) {
    if (qChannel.isDM) {
      postTranslated(qChannel, 'stopChannelInDm');
      return;
    }
    const guild = await qChannel.guild();
    [targetChannel] = args;
    const channelObj = guild.channels.find((c) => c.id === targetChannel);
    if (!channelObj) {
      postTranslated(qChannel, 'noSuchChannel', { targetChannel });
      return;
    }
    channelName = await new QChannel(channelObj).name();
  }
  const subs = await getChannelSubs(targetChannel);
  await rmChannel(targetChannel);
  log(
    `Removed all gets from channel ID:${targetChannel}. ${subs.length} subs removed.`,
    qChannel,
  );
  postTranslated(qChannel, 'stopChannelSuccess', { subs: subs.length, channelName });
};

const list = async (args, qChannel) => {
  const subs = await getChannelSubs(qChannel.id, true);
  formatSubsList(qChannel, subs);
};

const channelInfo = async (args, qChannel) => {
  const channelId = args.shift();
  if (!channelId) {
    postTranslated(qChannel, 'usage-admin-channel');
    return;
  }
  let qc = null;
  if (getChannel(channelId)) {
    qc = QChannel.unserialize({ channelId, isDM: false });
  } else {
    qc = QChannel.unserialize({ channelId, isDM: true });
  }
  if (!qc || !(await qc.obj())) {
    postTranslated(qChannel, 'adminInvalidId', { channelId });
    return;
  }
  const info = await formatQChannel(qc);
  postMessage(qChannel, info);
  const subs = await getChannelSubs(qc.id, true);
  formatSubsList(qChannel, subs);
};

const twitterInfo = async (args, qChannel) => {
  const screenName = args.shift();
  if (!screenName) {
    postTranslated(qChannel, 'usage-admin-twitter');
    return;
  }
  const user = await getUserFromScreenName(screenName);
  if (!user) {
    postTranslated(qChannel, 'adminInvalidTwitter', { screenName });
    return;
  }
  formatTwitterUser(qChannel, user.twitterId);
};

const lang = async (args, qChannel) => {
  const verb = args.shift();
  switch (verb[0]) {
    case 'l':
      formatLanguages(qChannel, supportedLangs);
      break;
    case 's': {
      const language = args.shift();
      if (!language) {
        postTranslated(qChannel, 'usage-lang-set');
        return;
      }
      if (supportedLangs.indexOf(language) === -1) {
        postTranslated(qChannel, 'noSuchLang', { language });
        return;
      }
      await setLang(qChannel.guildId(), language);
      postTranslated(qChannel, 'langSuccess');
      log(`Changed language to ${language}`, qChannel);
      break;
    }
    default:
      postTranslated(qChannel, 'invalidVerb', { verb });
  }
};

const guildInfo = async (args, qChannel) => {
  const gid = args.shift();
  if (!gid) {
    postTranslated(qChannel, 'usage-admin-guild');
    return;
  }
  const subs = await getGuildSubs(gid);
  formatSubsList(qChannel, subs);
};

const admin = (args, qChannel) => {
  const verb = args.shift();
  switch (verb[0]) {
    case 'c':
      channelInfo(args, qChannel);
      return;
    case 't':
      twitterInfo(args, qChannel);
      return;
    case 'g':
      guildInfo(args, qChannel);
      return;
    default: {
      postTranslated(qChannel, 'invalidVerb', { verb });
    }
  }
};

const announce = async (args) => {
  const msg = args.join(' ');
  const channels = await getUniqueChannels();
  log(`Posting announcement to ${channels.length} channels`);
  announcement(msg, channels);
};

const membersCount = async (_, qChannel) => {
  const channels = await getUniqueChannels();
  let members = 0;
  for (let i = 0; i < channels.length; i += 1) {
    const qc = QChannel.unserialize(channels[i]);
    const g = await qc.getGuild();
    if (g) {
      members += g.membersCount;
    }
  }
  postMessage(qChannel, `${members} members across ${channels.length} guilds`);
};

const help = async (args, qChannel) => {
  const guildLang = await getLang(qChannel.guildId());
  const embed = new RichEmbed()
    .setColor(0x0e7675)
    .setTitle(i18n(guildLang, 'helpHeader'))
    .setURL(profileURL)
    .setDescription(i18n(guildLang, 'helpIntro'))
    .addField(`${process.env.PREFIX}tweet`, i18n(guildLang, 'usage-tweet'))
    .addField(`${process.env.PREFIX}start`, i18n(guildLang, 'usage-start'))
    .addField(`${process.env.PREFIX}stop`, i18n(guildLang, 'usage-stop'))
    .addField(`${process.env.PREFIX}lang`, i18n(guildLang, 'usage-lang'))
    .addField(`${process.env.PREFIX}list`, i18n(guildLang, 'usage-list'))
    .setFooter(i18n(guildLang, 'helpFooter', { artist: 'ryusukehamamoto' }));
  postEmbed(qChannel, { embed });
};

export default {
  start: {
    function: start,
    checks: [
      {
        f: checks.isMod,
        badB: 'startForMods',
      },
    ],
    minArgs: 1,
  },
  lang: {
    function: lang,
    checks: [
      {
        f: checks.isMod,
        badB: 'langForMods',
      },
    ],
    minArgs: 1,
  },
  stop: {
    function: stop,
    checks: [
      {
        f: checks.isMod,
        badB: 'stopForMods',
      },
    ],
    minArgs: 1,
  },
  list: {
    function: list,
    checks: [],
    minArgs: 0,
  },
  admin: {
    function: admin,
    checks: [
      {
        f: checks.isAdmin,
        badB: 'adminForAdmin',
      },
      {
        f: checks.isDm,
        badB: 'cmdInDms',
      },
    ],
    minArgs: 1,
  },
  tweet: {
    function: tweet,
    checks: [],
    minArgs: 1,
  },
  tweetid: {
    function: tweetId,
    checks: [],
    minArgs: 1,
  },
  stopchannel: {
    function: stopchannel,
    checks: [
      {
        f: checks.isMod,
        badB: 'stopForMods',
      },
    ],
  },
  help: {
    function: help,
    checks: [],
    minArgs: 0,
  },
  leaveguild: {
    function: leaveGuild,
    checks: [
      {
        f: checks.isAdmin,
        badB: 'leaveForAdmin',
      },
    ],
    minArgs: 0,
  },
  memberscount: {
    function: membersCount,
    checks: [
      {
        f: checks.isAdmin,
      },
    ],
    minArgs: 0,
  },
  announce: {
    function: announce,
    checks: [
      {
        f: checks.isAdmin,
        badB: 'announceForAdmin',
      },
    ],
  },
};
