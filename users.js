const Discord = require("discord.js");
let users = (module.exports = {});

var fs = require("fs");

// Config file
var config = require("./config.json");

const post = require("./post");
const gets = require("./gets");
const discord = require("./discord");
const log = require("./log");

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   channels: Array of Gets
//   Get:
//    channel: channel object
//    text: Boolean, defines whether text posts should be sent to this channel
users.collection = {};

// Returns a list of channel objects, each in an unique guild
users.getUniqueChannels = () => {
  const channels = [];
  Object.keys(users.collection).forEach(userId => {
    const user = users.collection[userId];
    user.channels.forEach(get => {
      if (!channels.find(channel => channel.guild.id === get.channel.guild.id))
        channels.push(get.channel);
    });
  });
  return channels;
};

// Returns a list of get objects matching this guild, with added userId of the get
users.getGuildGets = guildId =>
  Object.keys(users.collection).reduce(
    (acc, userId) =>
      acc.concat(
        users.collection[userId].channels
          .filter(get => {
            if (
              get.channel &&
              get.channel.guild &&
              get.channel.guild.id === guildId
            )
              return true;
            console.log(get);
            return false;
          })
          .map(get => ({
            ...get,
            userId
          }))
      ),
    []
  );

// Returns a list of get objects matching this channel, with added userid of the get
users.getChannelGets = channelId =>
  Object.keys(users.collection).reduce(
    (acc, userId) =>
      acc.concat(
        users.collection[userId].channels
          .filter(get => get.channel.id === channelId)
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
  //    "userId" : {name: "screen_name", channels: [{id: channelId, text: bool}]}
  // }

  // Create a copy of the channels object, remove all timeouts from it
  let usersCopy = {};
  for (let userId in users.collection) {
    // Iterate over twitter users
    if (!users.collection.hasOwnProperty(userId)) continue;
    usersCopy[userId] = { channels: [] };
    if (users.collection[userId].hasOwnProperty("name")) {
      usersCopy[userId].name = users.collection[userId].name;
    }
    for (let get of users.collection[userId].channels) {
      let txt = get.hasOwnProperty("text") ? get.text : true;
      usersCopy[userId].channels.push({ id: get.channel.id, text: txt });
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
  fs.stat(config.getFile, function(err, stat) {
    if (err == null) {
      fs.readFile(config.getFile, "utf8", function(err, data) {
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
          let getsList = usersCopy[userId].channels;
          for (let get of getsList) {
            // Iterate over gets in channels
            let channel = discord.getChannel(get.id);
            let options = users.defaultOptions();
            if (get.hasOwnProperty("text") && !get.text) {
              options.text = false;
            }
            if (channel === undefined) {
              console.error(
                "W: Tried to load undefined channel: " +
                  get.id +
                  ", we most likely got kicked! :c"
              );
              continue;
            }
            gets.add(channel, userId, name, options);
          }
        }
        callback();
      });
    }
  });
};

// List users we're getting in this channel, available to everyone
users.list = channel => {
  const gets = users.getChannelGets(channel.id);
  if (gets.length < 1) {
    post.message(
      channel,
      `You aren't fetching tweets from anywhere!\nUse \`${
        config.prefix
      }start <twitter handle>\`to begin!`
    );
    return;
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`Tweet sources list`)
    .setURL(config.profileURL)
    .setDescription(
      `This is all ${gets.length} accounts you're getting tweets from`
    );
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
      post.embed(channel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`Tweet sources list (page ${page})`)
        .setURL(config.profileURL)
        .setDescription(
          `This is all ${gets.length} accounts you're getting tweets from`
        );
      counter = 0;
    }
  });
  if (counter > 0) post.embed(channel, { embed }, false);
};

users.adminListGuild = (channel, guildId) => {
  const gets = users.getGuildGets(guildId);
  if (gets.length < 1) {
    post.message(channel, `I'm not getting any tweets from guild ${guildId}!`);
    return;
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`Guild gets list`)
    .setURL(config.profileURL)
    .setDescription(
      `This is a complete list of all ${gets.length} gets for this guild!`
    );
  let counter = 0;
  gets.forEach(({ userId, channel: c, text }) => {
    const user = users.collection[userId];
    embed.addField(user.name, `#${c.name}, ${text ? "With text" : "No text"}`);
    counter++;
    if (counter > 20) {
      page++;
      post.embed(channel, { embed }, false);
      let embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`Guild gets list (page ${page})`)
        .setURL(config.profileURL)
        .setDescription(
          `This is a complete list of all ${gets.length} gets for this guild!`
        );
      counter = 0;
    }
  });
  if (counter > 0) post.embed(channel, { embed }, false);
};

// List all gets in every channel, available to the admin only, and in DMs
users.adminList = channel => {
  const guilds = users.getUniqueChannels().map(c => c.guild);
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`Global guild list`)
    .setURL(config.profileURL)
    .setDescription(
      `This is a complete list of all ${guilds.length} guilds I'm in!`
    );
  // We now have an object for every guild we're in
  let counter = 0;
  guilds.forEach(g => {
    embed.addField(
      g.name,
      `Guild ID: \`${g.id}\`\nOwner name: \`${g.owner.user.tag}\``
    );
    counter++;
    if (counter > 20) {
      page++;
      post.embed(channel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`Users list (page ${page})`)
        .setURL(config.profileURL)
        .setDescription(
          "This is a complete list of the twitter users I'm getting, with guild names and owner info!"
        );
      counter = 0;
    }
  });
  if (counter > 0) post.embed(channel, { embed }, false);
};
