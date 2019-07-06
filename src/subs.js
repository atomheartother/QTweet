import {
  getUserIds as SQL_getUserIds,
  getUserSubs as SQL_getUserSubs,
  getUniqueChannels as SQL_getUniqueChannels,
  getGuildSubs as SQL_getGuildSubs,
  getChannelSubs as SQL_getChannelSubs,
  rmChannel as SQL_rmChannel,
  getSubscription as SQL_getSub,
  getTwitterIdFromScreenName as SQL_getTwitterIdFromScreenName,
  rmUser as SQL_rmUser,
  addSubscription,
  removeSubscription,
  hasUser,
  addUser,
  open as openDb,
  close as closeDb,
  getGuildChannels
} from "./sqlite";

export const init = openDb;

export const close = closeDb;

export const getUserIds = SQL_getUserIds;

export const getSub = SQL_getSub;

export const getUserSubs = SQL_getUserSubs;

// Returns a list of channel objects, each in an unique guild
// DMs are also returned, as DMs are considered one-channel guilds
export const getUniqueChannels = SQL_getUniqueChannels;

// Returns a list of subscriptions matching this guild
export const getGuildSubs = SQL_getGuildSubs;

// Returns a list of subscriptions matching this channel
export const getChannelSubs = SQL_getChannelSubs;

export const getTwitterIdFromScreenName = SQL_getTwitterIdFromScreenName;

export const addUserIfNoExists = async (twitterId, name) => {
  const shouldAddUser = !(await hasUser(twitterId));
  if (shouldAddUser) {
    await addUser(twitterId, name);
  }
};

// Add a subscription to this userId or update an existing one
// Return values:
// 0: Subscription added
// 1: Subscription updated
export const add = async (channelId, twitterId, name, flags, isDM) => {
  const res = await addSubscription(channelId, twitterId, flags, isDM);
  await addUserIfNoExists(twitterId, name);
  return res;
};

export const rmUser = SQL_rmUser;

const deleteUserIfEmpty = async twitterId => {
  const subs = await getUserSubs(twitterId);
  if (subs.length === 0) {
    await rmUser(twitterId);
  }
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId, twitterId) => {
  const res = await removeSubscription(channelId, twitterId);
  await deleteUserIfEmpty(twitterId);
  return res;
};

export const rmChannel = async channelId => {
  const subs = await getChannelSubs(channelId);
  for (let i = 0; i < subs.length; i++) {
    const { twitterId } = subs[i];
    await rm(channelId, twitterId);
  }
  SQL_rmChannel(channelId);
  return subs.length();
};

export const rmGuild = async guildId => {
  const channels = await getGuildChannels(guildId);
  let subCount = 0;
  for (let i = 0; i < channels.length; i++) {
    const { channelId } = channels[i];
    const res = await rmChannel(channelId);
    subCount += res;
  }
  return { subs: subCount, channels: channels.length };
};
