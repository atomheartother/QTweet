import log from './log';
import { userLookup, createStream, getError } from './twitter';
import { rm, add, getUserIds as getAllSubs } from './subs';
import { post } from './shardManager';

const handleTwitterError = (qChannel, code, msg, screenNames) => {
  if (code === 17 || code === 34) {
    post(qChannel, {
      trCode: 'noSuchTwitterUser',
      count: screenNames.length,
      name: screenNames.toString(),
    }, 'translated');
  } else if (code === 18) {
    log('Exceeded user lookup limit');
    post(qChannel, { trCode: 'tooManyUsersRequested' }, 'translated');
  } else if (code === 144) {
    post(qChannel, { trCode: 'noSuchTwitterId' }, 'translated');
  } else {
    log(`Unknown twitter error: ${code} ${msg}`);
    post(qChannel, { trCode: 'twitterUnknwnError' }, 'translated');
  }
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
      post(qc, {
        trCode: 'startGeneralError',
        namesCount: screenNames.length,
      }, 'translated');
    } else {
      handleTwitterError(qc, code, msg, screenNames);
    }
    return null;
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
//   let data = [];
//   try {
//     data = await getUserIds(screenNames);
//   } catch (response) {
//     const { code, msg } = getError(response);
//     if (!code) {
//       log('Exception thrown without error', qChannel);
//       log(response, qChannel);
//       post(qChannel, {
//         trCode: 'getInfoGeneralError',
//         namesCount: screenNames.length,
//       }, 'translated');
//       return;
//     }
//     handleTwitterError(qChannel, code, msg, screenNames);

  //     return;
  //   }
  //   const promises = data.map(({ id_str: userId }) => rm(qChannel.id, userId));

//   const results = await Promise.all(promises);
//   const screenNamesFinal = data.map(({ screen_name: screenName }) => `@${screenName}`);
//   const lastName = screenNamesFinal.pop();
//   const removedObjectName = await formatScreenNames(
//     qChannel,
//     screenNamesFinal,
//     lastName,
//   );
//   const { users, subs } = results.reduce(
//     (acc, { subs: removedSubs, users: removedUsers }) => ({
//       subs: acc.subs + removedSubs,
//       users: acc.users + removedUsers,
//     }),
//     { users: 0, subs: 0 },
//   );
//   if (subs === 0) {
//     post(qChannel, { trCode: 'noSuchSubscription', screenNames: removedObjectName }, 'translated');
//   } else {
//     post(qChannel, {
//       trCode: 'stopSuccess',
//       screenNames: removedObjectName,
//     }, 'translated');
//     if (users > 0) createStream();
//   }
};
