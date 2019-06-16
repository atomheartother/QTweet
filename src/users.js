const Discord = require("discord.js");
let users = (module.exports = {});

var fs = require("fs");

// Config file
var config = require("../config.json");

const post = require("./post");
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
      const getId = await getQChannel.guildId();
      let unique = true;
      for (let qcIdx = 0; qcIdx < qChannels.length; qcIdx++) {
        const qcGOID = await qChannels[qcIdx].guildId();
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
      const gID = await get.qChannel.guildId();
      if (gID === guildId) {
        gets.push(...get, userId);
      }
    }
  }
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
          } else {
            // Old format, no DMs
            qChannel = new QChannel({ id: sub.id });
          }
          if (qChannel.id === null) {
            log(
              "Tried to load undefined channel: " +
                id +
                ", we most likely got kicked! :c"
            );
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

// List users we're getting in this channel, available to everyone
users.list = qChannel => {
  const gets = users.getChannelGets(qChannel.id);
  if (gets.length < 1) {
    post.message(
      qChannel,
      `**You aren't subscribed to any twitter users**!\nUse \`${
        config.prefix
      }start <twitter handle>\` to begin!`
    );
    return;
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`${gets.length} subscriptions:`)
    .setURL(config.profileURL);
  let counter = 0;
  gets.forEach(({ userId, text }) => {
    const twitterUser = users.collection[userId];
    embed.addField(
      twitterUser.name || twitterUser.id,
      text ? "With text posts" : "No text posts"
    );
    counter++;
    if (counter > 20) {
      page++;
      post.embed(qChannel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`${gets.length} subscriptions (page ${page}):`)
        .setURL(config.profileURL);
      counter = 0;
    }
  });
  if (counter > 0) post.embed(qChannel, { embed }, false);
};

users.adminListGuild = async (qChannel, guildId) => {
  const gets = await users.getGuildGets(guildId);
  if (gets.length < 1) {
    post.message(qChannel, `I'm not getting any tweets from guild ${guildId}!`);
    return;
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`${gets.length} subscriptions for this guild:`)
    .setURL(config.profileURL);
  let counter = 0;
  gets.forEach(({ userId, qChannel, text }) => {
    const user = users.collection[userId];
    embed.addField(
      user.name,
      `${qChannel.name}, ${text ? "With text" : "No text"}`
    );
    counter++;
    if (counter > 20) {
      page++;
      post.embed(qChannel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`${gets.length} subscriptions for this guild (page ${page}):`)
        .setURL(config.profileURL);
      counter = 0;
    }
  });
  if (counter > 0) post.embed(qChannel, { embed }, false);
};

// List all gets in every channel, available to the admin only, and in DMs
users.adminList = async qChannel => {
  const qChannels = await users.getUniqueChannels();
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`In ${qChannels.length} guilds:`)
    .setURL(config.profileURL);
  // We now have an object for every guild we're in
  let counter = 0;
  for (let i = 0; i < qChannels.length; i++) {
    const qc = qChannels[i];
    const g = await qc.guild();
    if (g !== null) {
      embed.addField(
        g.name,
        `Guild ID: \`${g.id}\`\nOwner name: \`${g.owner.user.tag}\``
      );
    } else {
      embed.addField(qc.name, `ID: ${qc.id}`);
    }
    counter++;
    if (counter > 20) {
      page++;
      post.embed(qChannel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`In ${qChannels.length} guilds (page ${page}):`)
        .setURL(config.profileURL);
      counter = 0;
    }
  }
  if (counter > 0) post.embed(qChannel, { embed }, false);
};
