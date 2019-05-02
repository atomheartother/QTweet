var post = (module.exports = {});
const config = require("./config.json");

const { tall } = require("tall");
let users = require("./users");

const postColors = {
  text: 0x69b2d6,
  video: 0x67d67d,
  image: 0xd667cf
};

function unshortenUrls(text, callback) {
  let startIdx = 0;
  let urls = [];
  let idx = text.indexOf("https://t.co/");
  while (idx !== -1) {
    const endIdx = text.indexOf(" ", idx);
    const url =
      endIdx === -1 ? text.substring(idx) : text.substring(idx, endIdx);
    urls.push(url);
    startIdx = idx + url.length;
    idx = text.indexOf("https://t.co/", startIdx);
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
    // Gif/video. We can't make it clickable, but we can make the tweet redirect to it
    let vidinfo = extended_entities.media[0].video_info;
    let vidurl = null;
    for (let vid of vidinfo.variants) {
      if (vid.content_type === "video/mp4") vidurl = vid.url;
    }
    let imgurl = extended_entities.media[0].media_url_https;
    if (vidurl !== null) {
      embed.title = text;
      embed.description = "[Link to video](" + vidurl + ")";
    }
    embed.color = postColors["video"];
    embed.image = { url: imgurl };
  } else {
    // Image
    console.log(extended_entities.media);
    let imgurl = extended_entities.media[0].media_url_https;
    embed.color = postColors["image"];
    files = extended_entities.media.map(media => media.media_url_https);
    if (files.length === 1) {
      embed.image = { url: files[0] };
      files = null;
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
          console.error(
            new Date() +
              ": Reacting to message in channel " +
              channel.name +
              " failed!"
          );
        });
    })
    .catch(function(error) {
      console.log(
        new Date() +
          ": Tried to post an embed to " +
          channel.id +
          ", but it failed. We'll try to warn the user. If it fails it'll be reported in the error log."
      );
      console.log(error);
      post.message(
        channel,
        `Hello, I tried to post an embed in #${
          channel.name
        } but Discord won't let me! Did you give me permissions to send embed links?\nDiscord had this to say:\n${
          error.name
        }: ${error.message}`
      );
    });
};

post.message = (channel, message) => {
  channel.send(message).catch(function(error) {
    console.error(
      `${new Date()}: Sending message to channel ${channel.name} (${
        channel.guild.name
      } - ${channel.guild.id}) failed: ${message}`
    );
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
        - If I'm somehow still messing up, please contact my creator, Tom'#4242, he'll try his best to help.`
      )
      .then(message)
      .catch(function(err) {
        console.error(
          new Date() +
            ": Sending message to guild owner " +
            channel.guild.owner.tag +
            " failed too!"
        );
      });
  });
};
