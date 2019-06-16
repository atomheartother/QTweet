let gets = (module.exports = {});

let users = require("./users");
let twitter = require("./twitter");
const post = require("./post");
var config = require("../config.json");

// Add a get to the user list
gets.add = (qChannel, userId, name, { text }) => {
  if (!users.collection.hasOwnProperty(userId)) {
    // Create the user object
    users.collection[userId] = { subs: [] };
  }
  if (name !== null && !users.collection[userId].name !== name) {
    users.collection[userId].name = name;
  }

  if (users.collection[userId].subs.find(get => get.qChannel.id == qChannel.id))
    return;

  users.collection[userId].subs.push({
    qChannel,
    text
  });
};

// Remove a get from the user list
// This function doesn't save to fs automatically
gets.rm = (qChannel, screenName) => {
  twitter
    .userLookup({ screen_name: screenName })
    .then(function(data) {
      let userId = data[0].id_str;
      if (!users.collection.hasOwnProperty(userId)) {
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
      const idx = users.collection[userId].subs.findIndex(
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
      users.collection[userId].subs.splice(idx, 1);
      if (users.collection[userId].subs.length < 1) {
        // If no one needs this user's tweets we can delete the entry
        delete users.collection[userId];
        // ...and re-register the stream, which will now delete the user
        twitter.createStream();
      }
      post.message(
        qChannel,
        `**I've unsubscribed you from @${screenName}!**\nYou should now stop getting any messages from them.`
      );
      users.save();
    })
    .catch(function(err) {
      post.message(
        qChannel,
        "I can't find a user by the name of " + screenName
      );
    });
};

gets.rmChannel = channelId => {
  let count = 0;
  let usersChanged = false;
  // Remove all instances of this channel from our gets
  Object.keys(users.collection).forEach(userId => {
    let user = users.collection[userId];
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
      delete users.collection[userId];
      usersChanged = true;
    }
  });
  // Save any changes we did to the users object
  users.save();
  // ...and re-register the stream, which will be properly updated
  if (usersChanged) twitter.createStream();
  return count;
};

gets.rmGuild = async id => {
  let usersChanged = false;
  // Remove all instances of this guild from our gets
  const keysArray = Object.keys(users.collection);
  for (let i = keysArray.length - 1; i >= 0; i--) {
    const userId = keysArray[i];
    let user = users.collection[userId];
    let x = user.subs.length;
    while (x--) {
      const gid = await user.subs[x].qChannel.guildId();
      if (id === gid) {
        // We should remove this get
        user.subs.splice(x, 1);
      }
    }
    if (user.subs.length < 1) {
      usersChanged = true;
      // If no one needs this user's tweets we can delete the enty
      delete users.collection[userId];
    }
  }
  // Save any changes we did to the users object
  users.save();
  // ...and re-register the stream, which will be properly updated
  if (usersChanged) twitter.createStream();
};
