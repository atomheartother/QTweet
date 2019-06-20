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

// Handle an error with sending a message:
// - Try to notify the user
// - Plan for the notification failing too
const handleDiscordPostError = async (
  error,
  qChannel,
  type,
  msg,
  errorCount = 0
) => {
  const errCode = error.statusCode || error.code || error.status;
  // We keep fucking up. Stop trying.
  if (errorCount >= 2) {
    log(
      `${errCode}: Discord servers failed receiving ${type} ${errorCount} times, giving up`,
      qChannel
    );
    return;
  }
  const postableQChannel = await qChannel.bestChannel();
  if (!postableQChannel || postableQChannel.id === null) {
    log(`Couldn't find a way to send ${type}`, qChannel);
    log(msg);
    return;
  }
  // New message type
  let newType = type;
  // New message to send
  let newMsg = msg;
  // Log message to print before sending
  let logMsg = "";
  // delay before sending
  let delay = 0;
  // channel to post to
  let newQchannel = postableQChannel;
  if (errCode === 404 || errCode === 10003) {
    // The channel was deleted or we don't have access to it, auto-delete it
    // And notify the user
    const count = gets.rmChannel(qChannel.id);
    logMsg = `${errCode}: Auto-deleted ${count} gets, qChannel removed`;
    newMsg = `**Inaccessible channel**: I tried to post in ${
      qChannel.name
    } but Discord says it doesn't exist anymore.\nI took the liberty of stopping all ${count} subscriptions in that channel.\n\nIf this isn't what you wanted, please contact my creator through our support server!`;
    newType = "404 notification";
    resend = false;
  } else if (
    errCode === 403 ||
    errCode === 50013 ||
    errCode === 50001 ||
    errCode === 50004 ||
    errCode === 40001
  ) {
    // Discord MissingPermissions error
    // Try to notify the user that something is wrong
    logMsg = `Tried to post ${type} but lacked permissions: ${errCode} ${
      error.name
    }`;
    newMsg = `**Missing Permissions:** I couldn't send a ${type} in ${
      qChannel.name
    }.\nIf a mod could give me the **Send Messages**, **Send Embeds** and **Attach Files** permissions there that would be nice.\nIf you'd like me to stop trying to send messages there, moderators can use \`${
      config.prefix
    }stopchannel ${
      qChannel.id
    }\`.\nIf you think you've done everything right but keep getting this message, join our support server, it's linked in my \`${
      config.prefix
    }help\` message.`;
    newType = "permission message";
  } else if (
    errCode === "ECONNRESET" ||
    errCode === "read ECONNRESET" ||
    errCode === 504
  ) {
    // There was an error
    logMsg = `${errCode}: Discord servers failed when I tried to send ${type}`;
    delay = errorCount * 1500;
    // retry posting in the same channel
    newQchannel = qChannel;
  } else if (errCode === 50007) {
    logMsg = `This user won't accept DMs from us`;
    newQchannel = null;
  } else {
    logMsg = `Posting ${type} failed (${errCode} ${error.name}): ${
      error.message
    }`;
    newQchannel = null;
    log(qChannel);
    log(msg);
  }
  log(`${logMsg} (attempt #${errorCount})`, qChannel);
  if (newQchannel !== null)
    setTimeout(() => {
      newQchannel
        .send(newMsg)
        .then(log(`Sent ${newType}`, newQchannel))
        .catch(err => {
          handleDiscordPostError(
            err,
            newQchannel,
            newType,
            newMsg,
            errorCount + 1
          );
        });
    }, delay);
};

// React is a boolean, if true, add a reaction to the message after posting
post.embed = (qChannel, embed) => {
  qChannel.send(embed).catch(err => {
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

post.dm = (qChannel, message) => {
  qChannel.sendToOwner(message).catch(err => {
    handleDiscordPostError(err, qChannel, "dm", message);
  });
};
