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
  let solvedUrls = 0;
  urls.forEach((shortUrl, idx) => {
    tall(shortUrl)
      .then(longUrl => {
        text = text.replace(
          shortUrl,
          idx === urls.length - 1 ? `\n[Tweet](${longUrl})` : longUrl
        );
        solvedUrls++;
        if (solvedUrls === urls.length) {
          callback(text);
        }
      })
      .catch(() => {
        solvedUrls++;
        if (solvedUrls === urls.length) {
          callback(text);
        }
      });
  });
}

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
  // Unshorten all urls then post
  unshortenUrls(text, newText => {
    embed.description = newText;
    post.embed(channel, { embed, files }, true);
  });
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
    .catch(function(error) {
      if (error.statusCode === 404) {
        // The channel was deleted, auto-delete it
        const count = gets.rmChannel(channel.id);
        channel.guid.owner.send(
          `Hi! I recently tried to send a message to #${
            channel.name
          } but Discord tells me it doesn't exist anymore.\n\nI took the liberty of stopping all ${count} twitter fetches in that channel.\n\nIf this isn't what you wanted, please contact my owner \`Tom'#4242\` about this immediately!`
        );
        log(`Auto-deleted ${count} gets, channel removed`, channel);
        return;
      }
      log(
        `Posting an embed failed: ${error.name} ${error.statusCode}: ${
          error.message
        }`,
        channel
      );
      post.message(
        channel,
        `I tried to post an embed in #${
          channel.name
        } but Discord won't let me! My creator has been warned, but you can contact him if this persists.\n\nThis is the reason Discord gave: ${
          error.message
        }`
      );
    });
};

post.message = (channel, message) => {
  channel.send(message).catch(function(error) {
    log(`Sending message failed: ${message}`, channel);
    // Try to contact the guild owner
    channel.guild.owner
      .send(
        `Hello, I just tried sending a message to #${
          channel.name
        }, but I couldn't.\n\nHere's a few ways you can fix this:
        - Give me the "Send Messages" and "Send Embeds" permissions in that channel (I would also like to be able to post reactions please!)
        - If you'd like me to stop posting anything to that channel, just use the command \`${
          config.prefix
        }stopchannel ${channel.id}\` **inside** your server, not here.
        - If you'd like me to leave your server, simply kick me from it, I'll stop trying to post to it
        - If I'm somehow still messing up, please contact my creator, \`Tom'#4242\`, he'll try his best to help.`
      )
      .then(message)
      .catch(function(err) {
        log(
          `Sending message to guild owner ${channel.guild.owner.tag} failed too`
        );
      });
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
