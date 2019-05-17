var post = (module.exports = {});
const config = require("./config.json");

const { tall } = require("tall");
let users = require("./users");
const gets = require("./gets");
const log = require("./log");

const postColors = {
  text: 0x69b2d6,
  video: 0x67d67d,
  image: 0xd667cf,
  images: 0x53a38d
};

function unshortenUrls(text, callback) {
  let urls = [];
  let re = /https:\/\/t\.co\/[\w]+/g;
  let match = {};
  while ((match = re.exec(text))) {
    const url = text.substring(match.index, re.lastIndex);
    urls.push(url);
  }
  if (urls.length < 1) {
    callback(text);
    return;
  }

  const promises = urls.map((shortUrl, idx) =>
    tall(shortUrl).then(longUrl => ({
      shortUrl,
      longUrl,
      idx
    }))
  );
  Promise.all(promises)
    .then(results => {
      results.forEach(({ shortUrl, longUrl, idx }) => {
        text = text.replace(
          shortUrl,
          urls.length > 1 && idx === urls.length - 1
            ? `\n[Tweet](${longUrl})`
            : longUrl
        );
      });
      callback(text);
    })
    .catch(e => {
      log("The elusive buggerino!");
      log(`Total message: ${text}`);
      log(`URL we tried shortening: ${shortUrl}`);
      log(e);
    });
}

const handleDiscordPostError = (error, channel, type) => {
  const errCode = error.statusCode || error.code || error.status;
  if (errCode === 404 || errCode === 10003) {
    // The channel was deleted or we don't have access to it, auto-delete it
    const count = gets.rmChannel(channel.id);
    post.dm(
      channel.guild.owner,
      `Hi! I tried to #${
        channel.name
      } but Discord tells me I can't access it anymore.\n\nI took the liberty of stopping all ${count} twitter fetches in that channel.\n\nIf this isn't what you wanted, please contact my owner \`Tom'#4242\` about this immediately!`
    );
    log(`Auto-deleted ${count} gets, channel removed`, channel);
    return;
  }
  if (errCode === 403 || errCode === 50013) {
    // Discord MissingPermissions error
    post.dm(
      channel.guild.owner,
      `Hi! I just tried sending a message to #${
        channel.name
      } but Discord tells me I don't have permissions to post there.\nYou can either ${
        config.prefix
      }stop me from posting there or you can give me permissions to stop getting this message.`
    );
    log(
      "Tried to post an embed but didn't have permissions, notified owner",
      channel
    );
    return;
  }
  log(
    `Posting ${type} failed (${errCode} ${error.name}): ${error.message}`,
    channel
  );
  log(error, channel);
  post.dm(
    channel.guild.owner,
    `I'm trying to send a message in #${
      channel.name
    } but Discord won't let me! My creator has been warned, but you can contact him if this persists.\n\nThis is the reason Discord gave: ${
      error.message
    }`
  );
};

post.tweet = (channel, { user, text, extended_entities }, postTextTweets) => {
  // Author doesn't have a screenName field,
  // we use it for debugging and for error handling
  let embed = {
    author: {
      name: user.name,
      screenName: user.screen_name,
      url: "https://twitter.com/" + user.screen_name,
      icon_url: user.profile_image_url_https
    }
  };
  // For any additional files
  let files = null;
  if (
    users.collection.hasOwnProperty(user.id_str) &&
    !users.collection[user.id_str].hasOwnProperty("name")
  ) {
    // if we don't have that user's name, add it to our list
    users.collection[user.id_str].name = user.screen_name;
    users.save();
  }
  if (
    !(
      extended_entities &&
      extended_entities.hasOwnProperty("media") &&
      extended_entities.media.length > 0
    )
  ) {
    // Text tweet
    if (!postTextTweets) {
      // We were told not to post text tweets to this channel
      return;
    }
    embed.color = postColors["text"];
  } else if (
    extended_entities.media[0].type === "animated_gif" ||
    extended_entities.media[0].type === "video"
  ) {
    // Gif/video.
    const vidinfo = extended_entities.media[0].video_info;
    let vidurl = null;
    let bitrate = null;
    for (let vid of vidinfo.variants) {
      // Find the best video
      if (vid.content_type === "video/mp4" && vid.bitrate < 1000000) {
        const paramIdx = vid.url.lastIndexOf("?");
        const hasParam = paramIdx !== -1 && paramIdx > vid.url.lastIndexOf("/");
        vidurl = hasParam ? vid.url.substring(0, paramIdx) : vid.url;
        bitrate = vid.bitrate;
      }
    }
    if (vidurl !== null) {
      if (vidinfo.duration_millis < 20000 || bitrate === 0) files = [vidurl];
      else {
        embed.image = { url: extended_entities.media[0].media_url_https };
        text = `[Link to video](${vidurl})\n\n${text}`;
      }
    } else {
      log("Found video tweet with no valid url");
      log(vidinfo);
    }
    embed.color = postColors["video"];
  } else {
    // Image(s)
    files = extended_entities.media.map(media => media.media_url_https);
    if (files.length === 1) {
      embed.image = { url: files[0] };
      files = null;
      embed.color = postColors["image"];
    } else {
      embed.color = postColors["images"];
    }
  }
  // // Unshorten all urls then post
  // unshortenUrls(text, newText => {
  embed.description = text;
  post.embed(channel, { embed, files }, true);
  // });
};
// React is a boolean, if true, add a reaction to the message after posting
post.embed = (channel, embed, react) => {
  channel
    .send(embed)
    .then(function(message) {
      if (react)
        message.react("❤").catch(err => {
          // Don't log this as it's not critical
        });
    })
    .catch(err => {
      handleDiscordPostError(err, channel, "embed");
    });
};

post.message = (channel, message) => {
  channel.send(message).catch(err => {
    handleDiscordPostError(err, channel, "message");
  });
};

post.announcement = (message, channels) => {
  if (channels.length <= 0) return;
  const nextChannel = channels.shift();
  post.message(nextChannel, message);
  setTimeout(() => {
    post.announcement(message, channels);
  }, 1000);
};

post.dm = (author, message) => {
  author
    .send(message)
    .then(({ channel: authorDmChannel }) => {
      log(`Sent DM: ${message}`, authorDmChannel);
    })
    .catch(err => {
      log(`Couldn't sent a message to ${author.username}`);
      log(err);
    });
};
