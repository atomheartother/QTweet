var post = (module.exports = {});
const config = require("../config.json");

const { tall } = require("tall");
let users = require("./users");
const gets = require("./gets");
const log = require("./log");
const discord = require("./discord");

post.colors = {
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

const handleDiscordPostError = (error, qChannel, type, msg, errorCount = 0) => {
  const errCode = error.statusCode || error.code || error.status;
  if (errCode === 404 || errCode === 10003) {
    // The channel was deleted or we don't have access to it, auto-delete it
    const count = gets.rmChannel(qChannel.id);
    log(`${errCode}: Auto-deleted ${count} gets, qChannel removed`, qChannel);
    post.message(
      qChannel.owner(),
      `Hi! I tried to post in ${
        qChannel.name
      } but Discord tells me I can't access it anymore.\n\nI took the liberty of stopping all ${count} subscriptions in that channel.\n\nIf this isn't what you wanted, please contact my owner through our support server: ${
        config.supportServ
      }`
    );
    return;
  } else if (
    errCode === 403 ||
    errCode === 50013 ||
    errCode === 50001 ||
    errCode === 50004 ||
    errCode === 40001
  ) {
    // Discord MissingPermissions error
    // Try to find the 1st qChannel we can post in
    log(
      `Tried to post ${type} but lacked permissions: ${errCode} ${error.name}`,
      qChannel
    );
    const permissionsMsg = `**Missing Permissions:** I couldn't send a ${type} in ${
      qChannel.name
    }.\nIf a mod could give me the **Send Messages** and **Send Embeds** permissions there that would be nice.\nIf you'd like me to stop trying to send messages there, moderators can use \`${
      config.prefix
    }stopchannel ${
      qChannel.id
    }\`.\nIf you think you've done everything right but keep getting this message, join our support server, it's linked in my \`${
      config.prefix
    }help\` message.`;
    if (qChannel.type === "text" && errorCount === 0) {
      const postableQChannel = qChannel.firstPostableChannel();
      if (postableQChannel) {
        postableQChannel
          .send(permissionsMsg)
          .then(
            log("Sent a message asking to get permissions", postableQChannel)
          )
          .catch(err => {
            handleDiscordPostError(
              err,
              postableChannel,
              "message",
              permissionsMsg,
              1
            );
          });
        return;
      }
    }
    // If it was a message, just try and msg the owner
    post.message(qChannel.owner(), permissionsMsg);
    log(`${errCode}: Owner has been notified`, qChannel);
    return;
  } else if (
    errCode === "ECONNRESET" ||
    errCode === "read ECONNRESET" ||
    errCode === 504
  ) {
    // Discord servers fucked up, gatweay timeout
    if (errorCount >= 2) {
      log(
        `${errCode}: Discord servers failed receiving ${type} ${errorCount} times, giving up`,
        qChannel
      );
      return;
    }
    log(
      `${errCode}: Discord servers failed when I tried to send ${type} (attempt #${errorCount +
        1})`,
      qChannel
    );
    setTimeout(() => {
      qChannel.send(msg).catch(err => {
        handleDiscordPostError(err, qChannel, type, msg, errorCount + 1);
      });
    }, 5000);
    return;
  }
  log(
    `Posting ${type} failed (${errCode} ${error.name}): ${error.message}`,
    qChannel
  );
  log(error, qChannel);
  if (qChannel.type !== "dm")
    post.message(
      qChannel.owner(),
      `I'm trying to send a message in ${
        qChannel.name
      } but Discord won't let me! My creator has been warned, but you can contact him if this persists.\n\nThis is the reason Discord gave: ${errCode} ${
        error.message
      }`
    );
};

// React is a boolean, if true, add a reaction to the message after posting
post.embed = (qChannel, embed, react) => {
  qChannel
    .send(embed)
    .then(function(message) {
      if (react)
        message.react("❤").catch(err => {
          // Don't log this as it's not critical
        });
    })
    .catch(err => {
      handleDiscordPostError(err, qChannel, "embed", embed);
    });
};

post.message = (qChannel, message) => {
  qChannel.send(message).catch(err => {
    handleDiscordPostError(err, qChannel, "message", message);
  });
};

post.announcement = (message, qChannels) => {
  if (qChannels.length <= 0) return;
  const nextQChannel = qChannels.shift();
  post.message(nextQChannel, message);
  setTimeout(() => {
    post.announcement(message, qChannels);
  }, 1000);
};
