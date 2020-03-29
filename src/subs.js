import {
  getUserIds as SQLgetUserIds,
  getUserSubs as SQLgetUserSubs,
  getUniqueChannels as SQLgetUniqueChannels,
  getGuildSubs as SQLgetGuildSubs,
  getChannelSubs as SQLgetChannelSubs,
  getChannels as SQLgetChannels,
  rmChannel as SQLrmChannel,
  getSubscription as SQLgetSub,
  getUserFromScreenName as SQLgetUserFromScreenName,
  rmUser as SQLrmUser,
  addSubscription,
  removeSubscription,
  getUserInfo as SQLgetUserInfo,
  addChannel,
  getGuildInfo as SQLgetGuildInfo,
  addUser as SQLaddUser,
  init as initDb,
  close as closeDb,
  setLang as SQLsetLang,
  getLang as SQLgetLang,
  createGuild,
  rmGuild as SQLrmGuild,
  sanityCheck as dbSanityCheck,
  setPrefix as SQLsetPrefix,
} from './postgres';
import log from './log';
import { someoneHasChannel } from './shardManager';

export const init = initDb;

export const close = closeDb;

export const getSub = SQLgetSub;

export const getUserIds = SQLgetUserIds;

export const getUserSubs = SQLgetUserSubs;

// Returns a list of channel objects, each in an unique guild
// DMs are also returned, as DMs are considered one-channel guilds
export const getUniqueChannels = SQLgetUniqueChannels;

// Returns a list of subscriptions matching this guild
export const getGuildSubs = SQLgetGuildSubs;

// Returns a list of subscriptions matching this channel
export const getChannelSubs = SQLgetChannelSubs;

export const getUserFromScreenName = SQLgetUserFromScreenName;

export const addUser = SQLaddUser;

export const getUserInfo = SQLgetUserInfo;

export const setLang = SQLsetLang;

export const setPrefix = SQLsetPrefix;

export const addUserIfNoExists = async (twitterId, name) => addUser(twitterId, name);

export const addChannelIfNoExists = async (channelId, guildId, ownerId, isDM) => {
  await createGuild(guildId);
  if (isDM) {
    return addChannel(channelId, channelId, channelId, isDM);
  }
  return addChannel(channelId, guildId, ownerId, isDM);
};

// Makes sure everything is consistent
export const sanityCheck = async () => {
  const allChannels = await SQLgetChannels();
  log(`⚙️ Starting sanity check on ${allChannels.length} channels`);
  const areChannelsValid = await Promise.all(allChannels.map(
    (c) => someoneHasChannel(c).then((res) => ({ c, res })),
  ));
  const deletedChannels = await Promise.all(areChannelsValid.map(({ c, res }) => {
    if (res) {
      return null;
    }
    log(`Found invalid channel: ${c.channelId}`);
    return SQLrmChannel(c.channelId);
  }));
  const { channels, users, guilds } = await dbSanityCheck();
  log(`✅ Sanity check completed!\n${channels + deletedChannels.reduce((prev, del) => prev + del, 0)} channels, ${guilds} guilds, ${users} users removed.`);
};

export const rmChannel = async (channelId) => {
  const channels = await SQLrmChannel(channelId);
  const { users } = await dbSanityCheck();
  return { channels, users };
};


export const rmGuild = async (guildId) => {
  const { guilds } = await SQLrmGuild(guildId);
  const { channels, users } = await dbSanityCheck();
  return { channels, users, guilds };
};

export const updateUser = async (user) => {
  const usrInfo = await getUserInfo(user.id_str);
  if (!usrInfo || usrInfo.name !== user.screen_name) {
    return addUser(user.id_str, user.screen_name);
  }
  return 0;
};

// Add a subscription to this userId or update an existing one
export const add = async ({
  channelId, isDM, guildId, ownerId,
}, twitterId, name, flags) => {
  const users = await addUserIfNoExists(twitterId, name);
  const channels = await addChannelIfNoExists(channelId, guildId, ownerId, isDM);
  const subs = await addSubscription(channelId, twitterId, flags, isDM);
  return { subs, users, channels };
};

export const rmUser = async (twitterId) => {
  const users = await SQLrmUser(twitterId);
  const { channels } = await dbSanityCheck();
  return { users, channels };
};

export const getGuildInfo = async (guildId) => {
  const data = await SQLgetGuildInfo(guildId);
  const prefix = (data && data.prefix) || process.env.PREFIX;
  const lang = (data && data.lang) || process.env.DEFAULT_LANG;
  return { prefix, lang };
};

export const getLang = async (guildId) => {
  const guild = await SQLgetLang(guildId);
  return guild ? guild.lang : process.env.DEFAULT_LANG;
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId, twitterId) => {
  log(`Got rm request for ${channelId}, ${twitterId}`);
  const subs = await removeSubscription(channelId, twitterId);
  const { channels, users } = await dbSanityCheck();
  return { subs, channels, users };
};
