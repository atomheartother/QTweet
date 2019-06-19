let users = (module.exports = {});

var fs = require("fs");

// Config file
var config = require("../config.json");

const gets = require("./gets");
const log = require("./log");
const QChannel = require("./QChannel");

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   subs: Array of Gets
//   Get:
//    qChannel: QChannel object
//    text: Boolean, defines whether text posts should be sent to this channel
users.collection = {};

// Returns a list of channel objects, each in an unique guild
// DMs are also returned
users.getUniqueChannels = async () => {
  const qChannels = [];
  const keysArray = Object.keys(users.collection);
  for (let i = 0; i < keysArray.length; i++) {
    const user = users.collection[keysArray[i]];
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
users.getGuildGets = async guildId => {
  const gets = [];
  const keysArray = Object.keys(users.collection);
  for (let i = 0; i < keysArray.length; i++) {
    const userId = keysArray[i];
    const { subs } = users.collection[userId];
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
users.getChannelGets = channelId =>
  Object.keys(users.collection).reduce(
    (acc, userId) =>
      acc.concat(
        users.collection[userId].subs
          .filter(get => get.qChannel.id === channelId)
          .map(get => ({
            ...get,
            userId
          }))
      ),
    []
  );

users.defaultOptions = function() {
  return {
    text: true
  };
};

users.getTwitterIdFromScreenName = screenName => {
  const array = Object.keys(users.collection);
  for (let i = 0; i < array.length; i++) {
    const userId = array[i];
    if (
      users.collection[userId].name.toLowerCase() === screenName.toLowerCase()
    )
      return userId;
  }
  return null;
};

users.save = () => {
  // We save users as:
  // {
  //    "userId" : {name: "screen_name", subs: [{id: channelId, text: bool}]}
  // }

  // Create a copy of the channels object, remove all timeouts from it
  let usersCopy = {};
  for (let userId in users.collection) {
    // Iterate over twitter users
    if (!users.collection.hasOwnProperty(userId)) continue;
    usersCopy[userId] = { subs: [] };
    if (users.collection[userId].hasOwnProperty("name")) {
      usersCopy[userId].name = users.collection[userId].name;
    }
    for (let get of users.collection[userId].subs) {
      let txt = get.hasOwnProperty("text") ? get.text : true;
      usersCopy[userId].subs.push({ qc: get.qChannel.serialize(), text: txt });
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

users.load = callback => {
  fs.stat(config.getFile, (err, stat) => {
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
          let options = users.defaultOptions();
          if (sub.text === false) {
            options.text = false;
          }
          gets.add(qChannel, userId, name, options);
        }
      }
      callback();
    });
  });
};
