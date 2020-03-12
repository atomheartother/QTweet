import log from './log';
import {
  userLookup, createStream, getError, showTweet, formatTweet,
} from './twitter';
import { rm, add, getUserIds as getAllSubs } from './subs';
import { post } from './shardManager';

const handleTwitterError = (qc, code, msg, screenNames) => {
  if (code === 17 || code === 34) {
    return {
      cmd: 'postTranslated',
      qc,
      trCode: 'noSuchTwitterUser',
      count: screenNames.length,
      name: screenNames.toString(),

    };
  } if (code === 18) {
    log('Exceeded user lookup limit');
    return {
      cmd: 'postTranslated',
      qc,
      trCode: 'tooManyUsersRequested',

    };
  } if (code === 144) {
    return {
      cmd: 'postTranslated',
      qc,
      trCode: 'noSuchTwitterId',
    };
  }
  log(`Unknown twitter error: ${code} ${msg}`);
  return {
    cmd: 'postTranslated',
    qc,
    trCode: 'twitterUnknwnError',
  };
};

const getUserIds = async (screenNames) => {
  const chunks = 100;
  const promises = [];
  for (let i = 0; i < screenNames.length; i += chunks) {
    promises.push(userLookup({
      screen_name: screenNames.slice(i, i + chunks).toString(),
    }));
  }
  const arrays = await Promise.all(promises);
  return [].concat(...arrays);
};

export const start = async ({ qc, flags, screenNames }) => {
  let data = [];
  try {
    data = await getUserIds(screenNames);
  } catch (res) {
    const { code, msg } = getError(res);
    if (!code) {
      log('Exception thrown without error');
      log(res);
      return {
        cmd: 'postTranslated',
        qc,
        trCode: 'startGeneralError',
        namesCount: screenNames.length,
      };
    }
    return handleTwitterError(qc, code, msg, screenNames);
  }
  const allUserIds = await getAllSubs();
  if (allUserIds.length + data.length >= 5000) {
    // Filter out users which would be new users
    const filteredData = allUserIds.reduce((acc, { twitterId }) => {
      const idx = data.findIndex(({ id_str: userId }) => userId === twitterId);
      if (idx === -1) return acc;
      return acc.concat([data[idx]]);
    }, []);
      // If we've had to drop users, display a message
    if (filteredData.length !== data.length) {
      post(qc, { trCode: 'userLimit' }, 'translated');
    }
    // If all users were new users, we're done.
    if (filteredData.length <= 0) {
      return null;
    }
    data = filteredData;
  }
  const promises = data.map(({
    id_str: userId,
    screen_name: name,
  }) => add(qc, userId, name, flags));
  const results = await Promise.all(promises);
  const redoStream = !!results.find(({ users }) => users !== 0);
  if (redoStream) createStream();
  return { data, results };
};

export const stop = async ({ qc, screenNames }) => {
  let data = null;
  try {
    data = await getUserIds(screenNames);
  } catch (response) {
    const { code, msg } = getError(response);
    if (!code) {
      log(response);
      return {
        cmd: 'postTranslated',
        qc,
        trCode: 'getInfoGeneralError',
        namesCount: screenNames.length,
      };
    }
    return handleTwitterError(qc, code, msg, screenNames);
  }
  const promises = data.map(({ id_str: userId }) => rm(qc.channelId, userId));

  const results = await Promise.all(promises);
  const { users, subs } = results.reduce(
    (acc, { subs: removedSubs, users: removedUsers }) => ({
      subs: acc.subs + removedSubs,
      users: acc.users + removedUsers,
    }),
    { users: 0, subs: 0 },
  );
  if (users > 0) createStream();
  return { data, users, subs };
};

export const tweetId = async ({ qc, id }) => {
  let t = null;
  try {
    t = await showTweet(id);
  } catch (response) {
    const { code, msg } = getError(response);
    if (!code) {
      log('Exception thrown without error');
      return {
        cmd: 'postTranslated', qc, trCode: 'tweetIdGeneralError', id,
      };
    }
    return handleTwitterError(qc, code, msg, [id]);
  }
  const formattedPromise = formatTweet(t);
  const isQuoted = t.quoted_status && t.quoted_status.user;
  if (isQuoted) {
    const quotedPromise = formatTweet(t.quoted_status);
    return { isQuoted, formatted: await formattedPromise, quoted: await quotedPromise };
  }
  return { isQuoted, formatted: await formattedPromise };
};
