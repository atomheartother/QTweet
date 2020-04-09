import { MessageEmbed } from 'discord.js';
import {
  cmd,
} from './master';
import log from '../log';

import * as checks from './checks';
import {
  embed as postEmbed,
  embeds as postEmbeds,
  announcement,
  translated as postTranslated,
} from './post';
import {
  rmChannel,
  getChannelSubs,
  setLang,
  getLang,
  getGuildInfo,
  setPrefix,
} from '../subs';
import { compute as computeFlags } from '../flags';
import QChannel from './QChannel';
import { supportedLangs, profileURL } from '../../config.json';

import {
  formatSubsList,
  formatLanguages,
} from './format';

import {
  formatTweet,
} from '../twitter';

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

export const handleUserTimeline = async ({
  qc,
  res: tweets,
  msg: { screen_name: screenName },
}) => {
  const qChannel = QChannel.unserialize(qc);

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
    return;
  }
  if (tweets.length < 1) {
    postTranslated(qChannel, 'noTweets', { screenName });
    return;
  }
  const validTweets = tweets.filter((t) => t && t.user);
  if (validTweets.length === 0) {
    postTranslated(qChannel, 'noValidTweets');
    log('Invalid tweets from timeline', qChannel);
    log(tweets, qChannel);
    return;
  }
  const formattedTweets = await Promise.all(validTweets.map((t) => formatTweet(t, false)));
  const {
    successful,
    err,
  } = await postEmbeds(qChannel, formattedTweets.map(({ embed }) => embed).reverse());
  if (err) {
    log(`Error posting tweet ${successful + 1} / ${validTweets.length} from ${screenName}`, qChannel);
    log(err);
    return;
  }
  log(
    `Posted latest ${successful} tweet(s) from ${screenName}`,
    qChannel,
  );
};

const postTimeline = async (qChannel, screenName, count) => {
  cmd('tweet', {
    screen_name: screenName, tweet_mode: 'extended', count, qc: qChannel.serialize(),
  });
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
  const isMod = await checks.isChannelMod(author, qChannel);
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
  screenNames.forEach((screenName) => postTimeline(qChannel, screenName, count));
};

export const handleTweetId = async ({ qc, res: { formatted, isQuoted, quoted }, msg: { id } }) => {
  const qChannel = QChannel.unserialize(qc);

  const { embed } = formatted;
  postEmbed(qChannel, embed);
  log(`Posting tweet ${id}`, qChannel);

  if (isQuoted) {
    const { embed: quotedEmbed } = quoted;
    postEmbed(qChannel, quotedEmbed);
  }
};

const tweetId = (args, qChannel) => {
  const id = args[0];
  cmd('tweetId', { id, qc: qChannel.serialize() });
};

const start = async (args, qChannel) => {
  const { values, flags: strFlags } = argParse(args);
  const flags = computeFlags(strFlags);
  const screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postTranslated(qChannel, 'usage-start');
    return;
  }
  const ownerId = await qChannel.ownerId();
  const guildId = await qChannel.guildId();
  cmd('start', { screenNames, flags, qc: { ...qChannel.serialize(), ownerId, guildId } });
};

const stop = async (args, qChannel) => {
  const { values } = argParse(args);
  const screenNames = values.map(getScreenName);
  if (screenNames.length < 1) {
    postTranslated(qChannel, 'usage-stop');
    return;
  }
  cmd('stop', { screenNames, qc: qChannel.serialize() });
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
    const channelObj = guild.channels.cache.find((c) => c.id === targetChannel);
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
  const gid = await qChannel.guildId();
  const [subs, lan] = await Promise.all([getChannelSubs(qChannel.id, true), getLang(gid)]);
  const { cmd: command, ...data } = await formatSubsList(qChannel.serialize(), subs, lan);
  if (command === 'postList') {
    const { embeds } = data;
    postEmbeds(qChannel, embeds);
  } else {
    const { trCode, ...options } = data;
    postTranslated(qChannel, trCode, options);
  }
};

const setLangCmd = async (args, qChannel) => {
  const verb = args.shift();
  switch (verb[0]) {
    case 'l': {
      const gid = await qChannel.guildId();
      const language = await getLang(gid);
      const { embeds } = await formatLanguages(qChannel.serialize(), supportedLangs, language);
      postEmbeds(qChannel, embeds);
      break;
    }
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

const setPrefixCmd = async (args, qChannel) => {
  const prefix = args.shift();
  setPrefix(await qChannel.guildId(), prefix);
  postTranslated(qChannel, 'prefixSuccess', { prefix });
};

export const handleAnnounce = async ({ channels, msg }) => {
  const qChannelPromises = channels.map((channel) => {
    const qc = QChannel.unserialize(channel);
    return qc.obj();
  });
  const qChannelsObjs = await Promise.all(qChannelPromises);
  announcement(msg, channels.filter((c, index) => !!qChannelsObjs[index]));
};

const announce = async (args) => {
  const msg = args.join(' ');
  cmd('announce', { msg });
};

const help = async (args, qChannel) => {
  const { lang: language, prefix } = await getGuildInfo(qChannel.guildId());
  const embed = new MessageEmbed()
    .setColor(0x0e7675)
    .setTitle(i18n(language, 'helpHeader'))
    .setURL(profileURL)
    .setDescription(i18n(language, 'helpIntro'))
    .addField(`${prefix}tweet`, i18n(language, 'usage-tweet'))
    .addField(`${prefix}start`, i18n(language, 'usage-start'))
    .addField(`${prefix}stop`, i18n(language, 'usage-stop'))
    .addField(`${prefix}lang`, i18n(language, 'usage-lang'))
    .addField(`${prefix}list`, i18n(language, 'usage-list'))
    .setFooter(i18n(language, 'helpFooter', { artist: 'ryusukehamamoto' }));
  postEmbed(qChannel, { embed });
};

export default {
  start: {
    function: start,
    checks: [
      {
        f: checks.isChannelMod,
        badB: 'startForMods',
      },
    ],
    minArgs: 1,
  },
  lang: {
    function: setLangCmd,
    checks: [
      {
        f: checks.isServerMod,
        badB: 'langForMods',
      },
    ],
    minArgs: 1,
  },
  qtprefix: {
    function: setPrefixCmd,
    checks: [
      {
        f: checks.isServerMod,
        badB: 'prefixForMods',
      },
    ],
    minArgs: 1,
  },
  stop: {
    function: stop,
    checks: [
      {
        f: checks.isChannelMod,
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
        f: checks.isChannelMod,
        badB: 'stopForMods',
      },
    ],
  },
  help: {
    function: help,
    checks: [],
    minArgs: 0,
  },
  announce: {
    function: announce,
    checks: [
      {
        f: checks.isOwner,
        badB: 'announceForAdmin',
      },
    ],
  },
};
