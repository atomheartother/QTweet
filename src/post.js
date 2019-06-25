import * as config from "../config.json";
import { rmChannel } from "./subs";
import log from "./log";

// Return values for post functions:
// 0: Success
// 1: Unknown error / exception thrown
// 2: Error was handled and user warned
// 3: Number of attempts expired

const asyncTimeout = (f, ms) =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve(f());
    }, ms)
  );

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
    return 3;
  }
  // New message type
  let newType = type;
  // New message to send
  let newMsg = msg;
  // Log message to print before sending
  let logMsg = "";
  // delay before sending
  let delay = 0;
  // Return code in case of success
  let retCode = 0;
  // channel to post to
  let channelToPostIn = "best";
  if (errCode === 404 || errCode === 10003) {
    retCode = 2;
    // The channel was deleted or we don't have access to it, auto-delete it
    // And notify the user
    const count = rmChannel(qChannel.id);
    logMsg = `${errCode}: Auto-deleted ${count} gets, qChannel removed`;
    newMsg = `**Inaccessible channel**: I tried to post in ${
      qChannel.name
    } but Discord says it doesn't exist anymore.\nI took the liberty of stopping all ${count} subscriptions in that channel.\n\nIf this isn't what you wanted, please contact my creator through our support server!`;
    newType = "404 notification";
  } else if (
    errCode === 403 ||
    errCode === 50013 ||
    errCode === 50001 ||
    errCode === 50004 ||
    errCode === 40001
  ) {
    retCode = 2;
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
    channelToPostIn = "same";
  } else if (errCode === 50007) {
    logMsg = `This user won't accept DMs from us`;
    channelToPostIn = "none";
  } else {
    retCode = 1;
    logMsg = `Posting ${type} failed (${errCode} ${error.name}): ${
      error.message
    }`;
    channelToPostIn = "none";
    log(qChannel);
    log(msg);
  }
  log(`${logMsg} (attempt #${errorCount})`, qChannel);
  if (channelToPostIn !== "none") {
    const targetChannel =
      channelToPostIn === "same"
        ? qChannel
        : await qChannel.bestChannel(newType);
    return asyncTimeout(async () => {
      try {
        await targetChannel.send(newMsg);
      } catch (err) {
        return handleDiscordPostError(
          err,
          targetChannel,
          newType,
          newMsg,
          errorCount + 1
        );
      }
      return retCode;
    }, delay);
  }
  return 1;
};

export const embed = async (qChannel, embed) => {
  try {
    await qChannel.send(embed);
  } catch (err) {
    return handleDiscordPostError(err, qChannel, "embed", embed);
  }
  return 0;
};

export const message = async (qChannel, content) => {
  try {
    await qChannel.send(content);
  } catch (err) {
    return handleDiscordPostError(err, qChannel, "message", content);
  }
  return 0;
};

export const announcement = (content, qChannels) => {
  if (qChannels.length <= 0) return;
  const nextQChannel = qChannels.shift();
  message(nextQChannel, content);
  setTimeout(() => {
    announcement(content, qChannels);
  }, 1000);
};

export const dm = async (qChannel, content) => {
  try {
    await qChannel.sendToOwner(content);
  } catch (err) {
    return handleDiscordPostError(err, qChannel, "dm", content);
  }
  return 0;
};
