import fs from "fs";
import * as config from "../config.json";
import QChannel from "./QChannel";

import { add } from "./gets";
import log from "./log";

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   subs: Array of Gets
//   Get:
//    qChannel: QChannel object, see QChannel.js
//    flags: Flags object
//    Flags:
//      notext: Boolean, if true we don't post text posts to this channel
//      retweet: Boolean, if true we post retweets to this channel
export const collection = {};

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

export const defaultFlags = {
  notext: false,
  retweet: false,
  noquote: false
};

const FlagsEnum = Object.freeze({
  notext: 1,
  retweet: 2,
  noquote: 4
});

const serializeFlags = flags => {
  let f = 0;
  Object.keys(FlagsEnum).forEach(k => {
    if (flags[k]) {
      f += FlagsEnum[k];
    }
  });
  return f;
};

const unserializeFlags = f => {
  const flags = {};
  Object.keys(FlagsEnum).forEach(k => {
    flags[k] = (f & FlagsEnum[k]) === FlagsEnum[k];
  });
  return flags;
};

export const getTwitterIdFromScreenName = screenName => {
  const array = Object.keys(collection);
  for (let i = 0; i < array.length; i++) {
    const userId = array[i];
    if (collection[userId].name.toLowerCase() === screenName.toLowerCase())
      return userId;
  }
  return null;
};

export const save = () => {
  // We save users as:
  // {
  //    "userId" : {name: "screen_name", subs: [{id: qChannel.id, f: Int (bitfields)}]}
  // }

  // Create a copy of the channels object, remove all timeouts from it
  let usersCopy = {};
  for (let userId in collection) {
    // Iterate over twitter users
    if (!collection.hasOwnProperty(userId)) continue;
    usersCopy[userId] = { subs: [] };
    if (collection[userId].hasOwnProperty("name")) {
      usersCopy[userId].name = collection[userId].name;
    }
    for (const { qChannel, flags } of collection[userId].subs) {
      usersCopy[userId].subs.push({
        qc: qChannel.serialize(),
        f: serializeFlags(flags)
      });
    }
  }
  let json = JSON.stringify(usersCopy);
  fs.writeFile(config.getFile, json, "utf8", function(err) {
    if (err !== null) {
      console.error("Error saving users object:");
      console.error(err);
    }
  });
};

export const load = callback => {
  fs.stat(config.getFile, err => {
    if (err) {
      log(err);
      return;
    }
    fs.readFile(config.getFile, "utf8", async (err, data) => {
      if (err) {
        log("There was a problem reading the config file");
        return;
      }
      // Restore the channels object from saved file
      let usersCopy = JSON.parse(data);
      for (let userId in usersCopy) {
        // Iterate over users
        if (!usersCopy.hasOwnProperty(userId)) continue;

        let name = usersCopy[userId].hasOwnProperty("name")
          ? usersCopy[userId].name
          : null;
        // Support the old format where subs were named channels
        const subList = usersCopy[userId].subs || usersCopy[userId].channels;
        // Iterate over every subscription
        for (const sub of subList) {
          let qChannel = null;
          if (sub.qc) {
            // New format, we can unserialize
            qChannel = await QChannel.unserialize(sub.qc);
          } else if (sub.id) {
            // Old format, no DMs
            qChannel = new QChannel({ id: sub.id });
          }
          if (!qChannel || qChannel.id === null) {
            log(
              `Tried to load invalid qChannel for userId ${userId} (${name})`
            );
            log(sub);
            continue;
          }
          let flags = null;
          if (sub.f !== undefined) {
            // New format, we unserialize flags
            flags = unserializeFlags(sub.f);
          } else if (sub.text === false) {
            // Olf format, build flags and support the old text boolean
            flags = {
              ...defaultFlags,
              notext: true
            };
          } else {
            flags = defaultFlags;
          }
          add(qChannel, userId, name, flags);
        }
      }
      callback();
    });
  });
};
