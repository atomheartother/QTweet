const Discord = require("discord.js");
let users = (module.exports = {});

var fs = require("fs");

// Config file
var config = require("./config.json");

let post = require("./post");
let gets = require("./gets");
let discord = require("./discord");

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   channels: Array of Gets
//   Get:
//    channel: channel object
//    text: Boolean, defines whether text posts should be sent to this channel
users.collection = {};

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
      console.log("Loading gets from " + config.getFile);
      fs.readFile(config.getFile, "utf8", function(err, data) {
        if (err) {
          console.error("There was a problem reading the config file");
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
  let userIds = [];
  Object.keys(users.collection).forEach(userId => {
    if (!users.collection.hasOwnProperty(userId)) return;

    let twitterUser = users.collection[userId];
    if (twitterUser.channels.find(get => get.channel.id === channel.id)) {
      userIds.push(userId);
    }
  });

  if (userIds.length < 1) {
    post.message(channel, "You aren't fetching tweets from anywhere!");
    return;
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`Tweet sources list (page ${page})`)
    .setURL("https://github.com/atomheartother/A-I-kyan")
    .setDescription(
      "This is a complete list of the accounts you're fetching tweets from"
    );
  let counter = 0;
  for (let userId of userIds) {
    const twitterUser = users.collection[userId];
    embed.addField(twitterUser.name || twitterUser.id, `(${userId})`);
    counter++;
    if (counter > 20) {
      page++;
      post.embed(channel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`Tweet sources list (page ${page})`)
        .setURL("https://github.com/atomheartother/A-I-kyan")
        .setDescription(
          "This is a complete list of the accounts you're fetching tweets from"
        );
      counter = 0;
    }
  }
  if (counter > 0) post.embed(channel, { embed }, false);
};

// List all gets in every channel, available to the admin only, and in DMs
users.adminList = channel => {
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(0xf26d7a)
    .setTitle(`Users list (page ${page})`)
    .setURL("https://github.com/atomheartother/A-I-kyan")
    .setDescription(
      "This is a complete list of the twitter users I'm getting, with guild names and owner info!"
    );
  let counter = 0;
  for (let userId in users.collection) {
    if (!users.collection.hasOwnProperty(userId)) continue;

    let twitterUser = users.collection[userId];
    let str = "";
    for (let get of twitterUser.channels) {
      str +=
        "\n- **G**: `" +
        get.channel.guild.name +
        "` -- **ID**: `" +
        get.channel.guild.id +
        "` -- **O**: `" +
        get.channel.guild.owner.user.tag +
        "`";
    }
    embed.addField(twitterUser.name, str);
    counter++;
    if (counter > 20) {
      page++;
      post.embed(channel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(0xf26d7a)
        .setTitle(`Users list (page ${page})`)
        .setURL("https://github.com/atomheartother/A-I-kyan")
        .setDescription(
          "This is a complete list of the twitter users I'm getting, with guild names and owner info!"
        );
      counter = 0;
    }
  }
  if (counter > 0) post.embed(channel, { embed }, false);
};
