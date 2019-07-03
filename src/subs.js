import * as config from "../config.json";
import { userLookup, createStream } from "./twitter";
import { message as postMessage } from "./post";

import {
  getUserIds as SQL_getUserIds,
  getUserSubs as SQL_getUserSubs
} from "./sqlite";

import log from "./log";

export const getUserIds = async () => {
  try {
    const rows = await SQL_getUserIds();
    return rows.map(row => row.twitterId);
  } catch (e) {
    log("Something went wrong getting user IDs");
    log(e);
    return null;
  }
};

export const getUserSubs = async () => {
  return SQL_getUserSubs();
};

// Returns a list of channel objects, each in an unique guild
// DMs are also returned
export const getUniqueChannels = async () => {
  const qChannels = [];
  const keysArray = Object.keys(collection);
  for (let i = 0; i < keysArray.length; i++) {
    const user = collection[keysArray[i]];
    for (let j = 0; j < user.subs.length; j++) {
      const getQChannel = user.subs[j].qChannel;
      const { gid: getId } = getQChannel;
      let unique = true;
      for (let qcIdx = 0; qcIdx < qChannels.length; qcIdx++) {
        const { gid: qcGOID } = await qChannels[qcIdx];
        if (qcGOID === getId) {
          unique = false;
          break;
        }
      }
      if (unique) qChannels.push(user.subs[j].qChannel);
    }
  }
  return qChannels;
};

// Returns a list of get objects matching this guild, with added userId of the get
export const getGuildGets = async guildId => {
  const gets = [];
  const keysArray = Object.keys(collection);
  for (let i = 0; i < keysArray.length; i++) {
    const userId = keysArray[i];
    const { subs } = collection[userId];
    for (let j = 0; j < subs.length; j++) {
      const get = subs[j];
      if (get.qChannel.type === "dm") continue;
      const { gid } = get.qChannel;
      if (gid === guildId) {
        gets.push({ ...get, userId });
      }
    }
  }
  return gets;
};

// Returns a list of get objects matching this channel, with added userid of the get
export const getChannelGets = channelId =>
  Object.keys(collection).reduce(
    (acc, userId) =>
      acc.concat(
        collection[userId].subs
          .filter(get => get.qChannel.id === channelId)
          .map(get => ({
            ...get,
            userId
          }))
      ),
    []
  );

export const getTwitterIdFromScreenName = screenName => {
  const array = Object.keys(collection);
  for (let i = 0; i < array.length; i++) {
    const userId = array[i];
    if (collection[userId].name.toLowerCase() === screenName.toLowerCase())
      return userId;
  }
  return null;
};

// Add a subscription to this userId or update an existing one
export const add = (qChannel, userId, name, flags) => {
  if (!collection[userId]) {
    // Create the user object
    collection[userId] = { subs: [] };
  }
  if (name !== null && !collection[userId].name !== name) {
    collection[userId].name = name;
  }

  const idx = collection[userId].subs.findIndex(
    get => get.qChannel.id == qChannel.id
  );
  if (idx > -1) {
    // We already have a get from this channel for this user. Update it
    collection[userId].subs[idx].flags = flags;
  } else {
    collection[userId].subs.push({
      qChannel,
      flags
    });
  }
};

// Remove a get from the user list
// This function doesn't save to fs automatically
export const rm = (qChannel, screenName) => {
  userLookup({ screen_name: screenName })
    .then(function(data) {
      let userId = data[0].id_str;
      if (!collection[userId]) {
        postMessage(
          qChannel,
          "**You're not  subscribed to this user.**\nUse `" +
            config.prefix +
            "start " +
            screenName +
            "` to get started!"
        );
        return;
      }
      const idx = collection[userId].subs.findIndex(
        ({ qChannel: { id } }) => qChannel.id == id
      );
      if (idx == -1) {
        postMessage(
          qChannel,
          "**You're not subscribed to this user.**\nUse `" +
            config.prefix +
            "start " +
            screenName +
            "` to get started!"
        );
        return;
      }
      // Remove element from channels
      collection[userId].subs.splice(idx, 1);
      if (collection[userId].subs.length < 1) {
        // If no one needs this user's tweets we can delete the entry
        delete collection[userId];
        // ...and re-register the stream, which will now delete the user
        createStream();
      }
      postMessage(
        qChannel,
        `**I've unsubscribed you from @${screenName}!**\nYou should now stop getting any messages from them.`
      );
      save();
    })
    .catch(() => {
      postMessage(qChannel, "I can't find a user by the name of " + screenName);
    });
};

export const rmChannel = channelId => {
  let count = 0;
  let usersChanged = false;
  // Remove all instances of this channel from our gets
  Object.keys(collection).forEach(userId => {
    let user = collection[userId];
    var i = user.subs.length;
    while (i--) {
      if (channelId === user.subs[i].qChannel.id) {
        count++;
        // We should remove this get
        user.subs.splice(i, 1);
      }
    }
    if (user.subs.length < 1) {
      // If no one needs this user's tweets we can delete the enty
      delete collection[userId];
      usersChanged = true;
    }
  });
  // Save any changes we did to the users object
  save();
  // ...and re-register the stream, which will be properly updated
  if (usersChanged) createStream();
  return count;
};

export const rmGuild = async id => {
  let usersChanged = false;
  // Remove all instances of this guild from our gets
  const keysArray = Object.keys(collection);
  for (let i = keysArray.length - 1; i >= 0; i--) {
    const userId = keysArray[i];
    let user = collection[userId];
    let x = user.subs.length;
    while (x--) {
      const { gid } = user.subs[x].qChannel;
      if (id === gid) {
        // We should remove this get
        user.subs.splice(x, 1);
      }
    }
    if (user.subs.length < 1) {
      usersChanged = true;
      // If no one needs this user's tweets we can delete the enty
      delete collection[userId];
    }
  }
  // Save any changes we did to the users object
  save();
  // ...and re-register the stream, which will be properly updated
  if (usersChanged) createStream();
};
