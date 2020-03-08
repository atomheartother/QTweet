import {
  getUserIds as SQLgetUserIds,
  getUserSubs as SQLgetUserSubs,
  getUniqueChannels as SQLgetUniqueChannels,
  getGuildSubs as SQLgetGuildSubs,
  getChannelSubs as SQLgetChannelSubs,
  getChannel,
  rmChannel as SQLrmChannel,
  getSubscription as SQLgetSub,
  getUserFromScreenName as SQLgetUserFromScreenName,
  rmUser as SQLrmUser,
  addSubscription,
  removeSubscription,
  getUserInfo as SQLgetUserInfo,
  addChannel,
  getAllSubs,
  addUser as SQLaddUser,
  init as initDb,
  close as closeDb,
  setLang as SQLsetLang,
  getLang as SQLgetLang,
  createGuild,
  rmGuild as SQLrmGuild,
  sanityCheck as dbSanityCheck,
} from './postgres';
import * as config from '../config.json';
import log from './log';

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
  log('Sanity check skipped...');
  // const allSubscriptions = await getAllSubs();
  // log(`Starting sanity check on ${allSubscriptions.length} subscriptions`);
  // for (let i = 0; i < allSubscriptions.length; i += 1) {
  //   const sub = allSubscriptions[i];
  //   const qc = QChannel.unserialize(sub);
  //   const obj = await qc.obj();
  //   if (!obj) {
  //     await SQLrmChannel(qc.id);
  //     log(
  //       `Found invalid qChannel: ${
  //         qc.id
  //       } (${
  //         qc.isDM
  //       }).`,
  //     );
  //   }
  // }
  // const { channels, users, guilds } = await dbSanityCheck();
  // log(`Removed ${channels} channels, ${guilds} guilds, ${users} users.`);
  // log('Sanity check completed.');
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
  id: channelId, isDM, guildId, ownerId,
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

export const getLang = async (guildId) => {
  const guild = await SQLgetLang(guildId);
  return guild ? guild.lang : config.defaultLang;
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId, twitterId) => {
  const subs = await removeSubscription(channelId, twitterId);
  const { channels, users } = await dbSanityCheck();
  return { subs, channels, users };
};
