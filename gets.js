let gets = (module.exports = {});

let users = require("./users");
let twitter = require("./twitter");
const post = require("./post");
var config = require("./config.json");

// Add a get to the user list
// options: {text: boolean}
gets.add = (channel, userId, screenName, options) => {
  if (!users.collection.hasOwnProperty(userId)) {
    // Create the user object
    users.collection[userId] = { channels: [] };
  }
  if (screenName != null && !users.collection[userId].hasOwnProperty("name")) {
    users.collection[userId].name = screenName;
  }

  if (
    users.collection[userId].channels.find(get => get.channel.id == channel.id)
  )
    return;

  users.collection[userId].channels.push({
    channel: channel,
    text: options.text
  });
};

// Remove a get from the user list
// This function doesn't save to fs automatically
gets.rm = (channel, screenName) => {
  twitter
    .userLookup({ screen_name: screenName })
    .then(function(data) {
      let userId = data[0].id_str;
      if (!users.collection.hasOwnProperty(userId)) {
        post.message(
          channel,
          "You're not currently `get`ting this user. Use `" +
            config.prefix +
            "start " +
            screenName +
            "` to do it!"
        );
        return;
      }
      let idx = -1;
      for (let i = 0; i < users.collection[userId].channels.length; i++) {
        let curChannel = users.collection[userId].channels[i].channel;
        if (curChannel.id == channel.id) {
          idx = i;
          break;
        }
      }
      if (idx == -1) {
        post.message(
          channel,
          "You're not currently `get`ting this user. Use `" +
            config.prefix +
            "start " +
            screenName +
            "` to do it!"
        );
        return;
      }
      // Remove element from channels
      users.collection[userId].channels.splice(idx, 1);
      if (users.collection[userId].channels.length < 1) {
        // If no one needs this user's tweets we can delete the enty
        delete users.collection[userId];
        // ...and re-register the stream, which will now delete the user
        twitter.createStream();
      }
      post.message(channel, "It's gone!");
      users.save();
    })
    .catch(function(err) {
      post.message(channel, "I can't find a user by the name of " + screenName);
    });
};

gets.rmChannel = channelId => {
  let count = 0;
  // Remove all instances of this channel from our gets
  Object.keys(users.collection).forEach(userId => {
    let user = users.collection[userId];
    var i = user.channels.length;
    while (i--) {
      if (channelId === user.channels[i].channel.id) {
        count++;
        // We should remove this get
        user.channels.splice(i, 1);
      }
    }
    if (user.channels.length < 1) {
      // If no one needs this user's tweets we can delete the enty
      delete users.collection[userId];
    }
  });
  // Save any changes we did to the users object
  users.save();
  // ...and re-register the stream, which will be properly updated
  twitter.createStream();
  return count;
};

gets.rmGuild = guild => {
  // Remove all instances of this guild from our gets
  Object.keys(users.collection).forEach(userId => {
    let user = users.collection[userId];
    var i = user.channels.length;
    while (i--) {
      if (guild.id === user.channels[i].channel.guild.id) {
        // We should remove this get
        user.channels.splice(i, 1);
      }
    }
    if (user.channels.length < 1) {
      // If no one needs this user's tweets we can delete the enty
      delete users.collection[userId];
    }
  });
  // Save any changes we did to the users object
  users.save();
  // ...and re-register the stream, which will be properly updated
  twitter.createStream();
};
