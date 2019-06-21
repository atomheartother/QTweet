import { save, collection } from "./users";

import * as config from "../config.json";

let twitter = require("./twitter");
const post = require("./post");

// Add a get to the user list
export const add = (qChannel, userId, name, flags) => {
  if (!collection.hasOwnProperty(userId)) {
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
  twitter
    .userLookup({ screen_name: screenName })
    .then(function(data) {
      let userId = data[0].id_str;
      if (!collection.hasOwnProperty(userId)) {
        post.message(
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
        post.message(
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
        twitter.createStream();
      }
      post.message(
        qChannel,
        `**I've unsubscribed you from @${screenName}!**\nYou should now stop getting any messages from them.`
      );
      save();
    })
    .catch(() => {
      post.message(
        qChannel,
        "I can't find a user by the name of " + screenName
      );
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
  if (usersChanged) twitter.createStream();
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
  if (usersChanged) twitter.createStream();
};
