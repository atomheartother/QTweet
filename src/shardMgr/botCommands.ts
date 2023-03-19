import log from '../log';
import {
  userTimeline, userLookup, getError, showTweet, formatTweet, hasMedia,
} from '../twitter';
import {createStream} from '../twitter-v2'
import { post, postAnnouncement } from './shardManager';
import { DbModificationsInfo, ShardMsgHandlerFunction } from '.';
import { add, rm } from '../db/subs';
import { getUniqueChannels } from '../db/channels';
import { getUserIds as SQLgetUserIds } from '../db/user';

const handleTwitterError = (code: number, msg: string, screenNames: string[]) => {
  if (code === 17 || code === 34) {
    return {
      cmd: 'postTranslated',
      trCode: 'noSuchTwitterUser',
      count: screenNames.length,
      name: screenNames.toString(),

    };
  } if (code === 18) {
    log('Exceeded user lookup limit');
    return {
      cmd: 'postTranslated',
      trCode: 'tooManyUsersRequested',

    };
  } if (code === 144) {
    return {
      cmd: 'postTranslated',
      trCode: 'noSuchTwitterId',
    };
  }
  log(`Unknown twitter error: ${code} ${msg}`);
  return {
    cmd: 'postTranslated',
    trCode: 'twitterUnknwnError',
  };
};

const getUserIds = async (screenNames: string[]): Promise<string[]> => {
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

export const start: ShardMsgHandlerFunction<'start'> = async ({
  qc, flags, screenNames, msg: tweetMessage,
}) => {
  let data = [];
  try {
    data = await getUserIds(screenNames);
  } catch (res) {
    const { code, msg, message } = getError(res);
    if (!code) {
      log('Exception thrown without error');
      log(res);
      return {
        cmd: 'postTranslated',
        trCode: 'startGeneralError',
        namesCount: screenNames.length,
      };
    }
    return handleTwitterError(code, msg || message, screenNames);
  }
  const allUserIds = await SQLgetUserIds();
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
  }) => add(qc, userId, name, flags, tweetMessage));
  const results = await Promise.all(promises);
  const redoStream = !!results.find(({ users }) => users !== 0);
  if (redoStream) createStream();
  return { data, results };
};

export const stop : ShardMsgHandlerFunction<'stop'> = async ({ qc, screenNames }) => {
  let data = null;
  try {
    data = await getUserIds(screenNames);
  } catch (response) {
    const { code, msg, message } = getError(response);
    if (!code) {
      log(response);
      return {
        cmd: 'postTranslated',
        trCode: 'getInfoGeneralError',
        namesCount: screenNames.length,
      };
    }
    return handleTwitterError(code, msg || message, screenNames);
  }
  const promises = data.map(({ id_str: userId }) => rm(qc.channelId, userId));

  const results: DbModificationsInfo[] = await Promise.all(promises);
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

export const tweet : ShardMsgHandlerFunction<'tweet'> = async ({ count, flags, ...params }) => {
  const TWEETS_MAX = 200;
  // Get tweets 200 by 200 until we have count tweets
  // or until we run out of tweets
  try {
    const tweets = [];
    let doneWithTimeline = false;
    let maxId: string | undefined;
    const p = {
      ...params,
      count: TWEETS_MAX,
    };
    const noRetweet = flags.indexOf('retweets') === -1;
    const noText = flags.indexOf('notext') !== -1;
    while (tweets.length < count && !doneWithTimeline) {
      // We can't really avoid await-ing inside of a loop here
      // as we don't know how often we need to await until we've read the result.
      // eslint-disable-next-line no-await-in-loop
      const res = await userTimeline(maxId ? {
        ...p,
        max_id: maxId,
      } : p);
      if (res.length === 0) {
        doneWithTimeline = true;
      } else {
        maxId = res[res.length - 1].id_str;
      }
      // Filter out retweets if the user asked us to
      tweets.push(
        ...res.filter((t) => (
          (!noText || hasMedia(t))
          && (!noRetweet || !t.retweeted_status)
        )),
      );
    }
    return tweets.slice(0, count);
  } catch (response) {
    const { screen_name: screenName } = params;
    const { code, msg, message } = getError(response);
    if (!code) {
      log('Exception thrown without error');
      return {
        cmd: 'postTranslated', trCode: 'tweetGeneralError', screenName,
      };
    }
    return handleTwitterError(code, msg || message, [screenName]);
  }
};

export const tweetId : ShardMsgHandlerFunction<'tweetId'> = async ({ id }) => {
  let t = null;
  try {
    t = await showTweet(id);
  } catch (response) {
    const { code, msg, message } = getError(response);
    if (!code) {
      log('Exception thrown without error');
      return {
        cmd: 'postTranslated', trCode: 'tweetIdGeneralError', id,
      };
    }
    return handleTwitterError(code, msg || message, [id]);
  }
  const formattedPromise = formatTweet(t);
  const isQuoted = t.quoted_status && t.quoted_status.user;
  if (isQuoted) {
    const quotedPromise = formatTweet(t.quoted_status, true);
    const [formatted, quoted] = await Promise.all([formattedPromise, quotedPromise]);
    return { isQuoted, formatted, quoted };
  }
  return { isQuoted, formatted: await formattedPromise };
};

export const announce : ShardMsgHandlerFunction<'announce'> = async ({ msg }) => {
  const channels = await getUniqueChannels();
  postAnnouncement(msg, channels);
  return null;
};
