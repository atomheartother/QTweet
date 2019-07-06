import * as config from "../config.json";
import { createStream } from "./twitter";
import { message as postMessage } from "./post";

import {
  getUserIds as SQL_getUserIds,
  getUserSubs as SQL_getUserSubs,
  getUniqueChannels as SQL_getUniqueChannels,
  getGuildSubs as SQL_getGuildSubs,
  getChannelSubs as SQL_getChannelSubs,
  rmChannel as SQL_rmChannel,
  rmGuild as SQL_rmGuild,
  getTwitterIdFromScreenName as SQL_getTwitterIdFromScreenName,
  rmUser as SQL_rmUser,
  addSubscription,
  removeSubscription,
  hasUser,
  addUser
} from "./sqlite";

import log from "./log";

export const getUserIds = SQL_getUserIds;

export const getUserSubs = SQL_getUserSubs;

// Returns a list of channel objects, each in an unique guild
// DMs are also returned, as DMs are considered one-channel guilds
export const getUniqueChannels = SQL_getUniqueChannels;

// Returns a list of subscriptions matching this guild
export const getGuildSubs = SQL_getGuildSubs;

// Returns a list of subscriptions matching this channel
export const getChannelSubs = SQL_getChannelSubs;

export const getTwitterIdFromScreenName = SQL_getTwitterIdFromScreenName;

export const addUserIfExists = async (twitterId, name) => {
  const shouldAddUser = !(await hasUser(twitterId));
  if (shouldAddUser) {
    await addUser(twitterId, name);
    createStream();
  }
};

// Add a subscription to this userId or update an existing one
export const add = async ({ id: channelId, type }, twitterId, name, flags) => {
  const res = await addSubscription(
    channelId,
    twitterId,
    flags,
    type === "dm" ? 1 : 0
  );
  addUserIfExists(twitterId, name);
  return res;
};

export const rmUser = SQL_rmUser;

const deleteUserIfEmpty = async twitterId => {
  const subs = await getUserSubs(twitterId);
  if (subs.length === 0) {
    await rmUser(twitterId);
    createStream();
  }
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId, twitterId) => {
  const res = await removeSubscription(channelId, twitterId);
  deleteUserIfEmpty(twitterId);
  return res;
};

export const rmChannel = async channelId => {
  const subs = await getChannelSubs(channelId);
  for (let i = 0; i < subs.length; i++) {
    const { twitterId } = subs[i];
    rm(channelId, twitterId);
  }
  SQL_rmChannel(channelId);
  return subs.length();
};

export const rmGuild = async guildId => {
  const channels = await getGuildChannels(guildId);
  for (let i = 0; i < channels.length; i++) {
    const { channelId } = channels[i];
    rmChannel(channelId);
  }
  return channels.length;
};
