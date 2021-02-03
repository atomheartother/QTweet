import log from '../log';
import QChannel from './QChannel/QChannel';
import i18n, { i18nOptions } from './i18n';
import { QCSerialized, QCSupportedChannel } from './QChannel/type';
import { getLang } from '../db/guilds';
import { ReactionUserManager } from 'discord.js';

// Return values for post functions:
// 0: Success
// 1: Unknown error / exception thrown, user wasn't warned
// 2: Error was handled and user warned
// 3: Number of attempts expired, user wasn't warned
// 4: No way to contact user about error

const asyncTimeout = <T=any>(f: Function, ms: number): Promise<T> => new Promise((resolve) => setTimeout(() => {
  resolve(f());
}, ms));

// Handle an error with sending a message:
// - Try to notify the user
// - Plan for the notification failing too
const handleDiscordPostError = async (
  error,
  qChannel: QChannel,
  type,
  msg,
  errorCount = 0,
): Promise<number> => {
  const errCode = error.statusCode || error.code || error.status;
  // We keep fucking up. Stop trying.
  if (errorCount >= 2) {
    log(
      `${errCode}: Discord servers failed receiving ${type} ${errorCount} times, giving up`,
      qChannel,
    );
    return 3;
  }
  // New message type
  let newType = type;
  // New message to send
  let newMsg = msg;
  // Log message to print before sending
  let logMsg = '';
  // delay before sending
  let delay = 0;
  // Return code in case of success
  let retCode = 0;
  // channel to post to
  let channelToPostIn = 'best';
  if (
    errCode === 404
    || errCode === 10003
    || (errCode === undefined && error.name === 'TypeError')
  ) {
    // Either the channel was deleted or Discord 404'd trying to access twitter data.
    retCode = 2;
    channelToPostIn = 'none';
    let obj: QCSupportedChannel = null;
    try {
      obj = await qChannel.obj()
    } catch (e) {
      log("Channel can't be turned into obj");
      console.log(e);
      log(qChannel.id);
      return 1;
    }
    if (!obj) {
      // Channel deleted
      // The channel was deleted or we don't have access to it
      // const { subs, users } = await rmChannel(qChannel.id);
      log(error);
      logMsg = `${errCode
        || 'no qChannel'}: This channel can't be built anymore, it should be deleted`;
    } else if (error.request && error.request.method === 'GET') {
      logMsg = `${errCode}: Discord encountered an error getting ${
        error.request.path
      }`;
    } else {
      log(error);
      log(msg);
      logMsg = `${errCode} on channel`;
    }
  } else if (
    errCode === 403
    || errCode === 50013
    || errCode === 50001
    || errCode === 50004
    || errCode === 40001
  ) {
    retCode = 2;
    // Discord MissingPermissions error
    // Try to notify the user that something is wrong
    logMsg = `Tried to post ${type} but lacked permissions: ${errCode} ${
      error.name
    }`;
    newMsg = i18n(await getLang(qChannel.guildId()), 'postPermissionError', {
      name: await qChannel.name(),
      id: qChannel.id,
    });
    newType = 'permission message';
  } else if (
    (
      !Number.isNaN(errCode)
      && Number(errCode) >= 500
      && Number(errCode) < 600
    )
    || errCode === 'ECONNRESET'
    || errCode === 'read ECONNRESET'
  ) {
    // There was an error
    logMsg = `${errCode}: Discord servers failed when I tried to send ${type}`;
    delay = errorCount * 1500;
    // retry posting in the same channel
    channelToPostIn = 'same';
  } else if (errCode === 50006) {
    log(msg, qChannel);
    logMsg = `${errCode}: Message was empty.`;
    channelToPostIn = 'none';
  } else if (errCode === 50007) {
    logMsg = 'This user won\'t accept DMs from us';
    channelToPostIn = 'none';
    retCode = 4;
  } else {
    logMsg = `Posting ${type} failed (${errCode} ${error.name}): ${
      error.message
    }`;
    log(msg);
    channelToPostIn = 'none';
  }
  log(`${logMsg} (attempt #${errorCount})`, qChannel);
  if (channelToPostIn === 'none') {
    return 1;
  }
  const targetChannel = channelToPostIn === 'same' ? qChannel : await qChannel.bestChannel(newType);
  if (!targetChannel || !targetChannel.id) {
    log("Couldn't find a way to send error notification", qChannel);
    return 4;
  }
  return asyncTimeout<number>(async (): Promise<number> => {
    try {
      await targetChannel.send(newMsg);
      log(`Posted ${newType} successfully`, targetChannel);
    } catch (err) {
      return handleDiscordPostError(
        err,
        targetChannel,
        newType,
        newMsg,
        errorCount + 1,
      );
    }
    return retCode;
  }, delay);
};

export const post = async (qChannel: QChannel, content: any, type: 'embed' | 'message'): Promise<number> => {
  try {
    await qChannel.send(content);
  } catch (err) {
    return handleDiscordPostError(err, qChannel, type, content);
  }
  return 0;
};

export const embed = (qChannel: QChannel, content: any): Promise<number> => post(qChannel, content, 'embed');

export const embeds = async (qChannel: QChannel, arr: any[]) => {
  let successful = 0;
  for (let i = 0; i < arr.length; i += 1) {
    const content = arr[i];
    // We have to do this for embeds to post in order
    // eslint-disable-next-line no-await-in-loop
    const errorCode = await embed(qChannel, content);
    if (errorCode !== 0) return { err: errorCode, successful };
    successful += 1;
  }
  return { err: null, successful };
};

export const message = (qChannel: QChannel, content: any) => post(qChannel, content, 'message');

export const translated = async (qChannel: QChannel, key: string, options: i18nOptions = {}) => message(qChannel,
  i18n(await getLang(qChannel.guildId()), key, options));

export const announcement = (content: any, channels: QCSerialized[]) => {
  if (channels.length <= 0) return;
  const nextQChannel = QChannel.unserialize(channels.shift());
  message(nextQChannel, content);
  setTimeout(() => {
    announcement(content, channels);
  }, 1000);
};

export const dm = async (qChannel: QChannel, content: any) => {
  try {
    await qChannel.sendToOwner(content);
  } catch (err) {
    return handleDiscordPostError(err, qChannel, 'dm', content);
  }
  return 0;
};
