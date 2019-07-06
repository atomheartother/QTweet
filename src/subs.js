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
    return 1;
  }
  return 0;
};

// Add a subscription to this userId or update an existing one
export const add = async (channelId, twitterId, name, flags, isDM) => {
  const subs = await addSubscription(channelId, twitterId, flags, isDM);
  // If we didn't update any subs we don't have to check for new users
  const users = subs === 0 ? 0 : await addUserIfNoExists(twitterId, name);
  return { subs, users };
};

export const rmUser = SQL_rmUser;

const deleteUserIfEmpty = async twitterId => {
  const subs = await getUserSubs(twitterId);
  if (subs.length === 0) {
    await rmUser(twitterId);
    return 1;
  }
  return 0;
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId, twitterId) => {
  const subs = await removeSubscription(channelId, twitterId);
  const users = subs === 0 ? 0 : await deleteUserIfEmpty(twitterId);
  return { subs, users };
};

export const rmChannel = async channelId => {
  const subArray = await getChannelSubs(channelId);
  let deletedSubs = 0;
  let deletedUsrs = 0;
  for (let i = 0; i < subArray.length; i++) {
    const { twitterId } = subArray[i];
    const { subs, users } = await rm(channelId, twitterId);
    deletedSubs += subs;
    deletedUsrs += users;
  }
  SQL_rmChannel(channelId);
  return { subs: deletedSubs, users: deletedUsrs };
};

export const rmGuild = async guildId => {
  const channels = await getGuildChannels(guildId);
  let deletedSubs = 0;
  let deletedUsrs = 0;
  for (let i = 0; i < channels.length; i++) {
    const { channelId } = channels[i];
    const { subs, users } = await rmChannel(channelId);
    deletedSubs += subs;
    deletedUsrs += users;
  }
  return { subs: deletedSubs, users: deletedUsrs, channels: channels.length };
};
