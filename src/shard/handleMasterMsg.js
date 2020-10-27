import { getLang } from '../subs';
import log from '../log';
import { handleUserTimeline, handleTweetId, handleAnnounce } from './commands';
import { post, translated } from './post';
import QChannel from './QChannel/QChannel';
import i18n from './i18n';

const handlePost = async ({ qc, content, type }) => {
  // This command can be broadcast to all shards, we must check that it's valid
  const qChannel = QChannel.unserialize(qc);
  if (!(await qChannel.obj())) return;
  if (type === 'translated') {
    const { trCode: code, ...params } = content;
    translated(qChannel, code, params);
    return;
  }
  post(qChannel, content, type);
};

const handlePostTranslated = ({ qc, res: { trCode, ...params } }) => {
  const qChannel = QChannel.unserialize(qc);
  translated(qChannel, trCode, params);
};

// This changes screenNames.
const formatScreenNames = async (qChannel, screenNames, lastName) => i18n(await getLang(qChannel.guildId()), 'formatUserNames', {
  count: screenNames.length + 1,
  names: screenNames.toString(),
  lastName,
});

const handleStart = async ({ qc, res: { data, results }, msg: { screenNames } }) => {
  const qChannel = QChannel.unserialize(qc);
  const screenNamesFinal = data.map(({
    screen_name: screenName,
  }) => `@${screenName}`);
  const nameCount = screenNamesFinal.length;
  const lastName = screenNamesFinal.pop();
  const addedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  if (results.find(({ subs }) => subs !== 0)) {
    translated(qChannel, 'startSuccess', {
      addedObjectName,
      nameCount,
      firstName: lastName,
      missedNames: screenNames.length !== nameCount ? 1 : 0,
    });
  } else {
    translated(qChannel, 'startUpdateSuccess', {
      addedObjectName,
    });
  }
  log(`Added ${addedObjectName}`, qChannel);
};

const handleStop = async ({ qc, res: { data, subs } }) => {
  const qChannel = QChannel.unserialize(qc);
  const screenNamesFinal = data.map(({ screen_name: screenName }) => `@${screenName}`);
  const lastName = screenNamesFinal.pop();
  const removedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  if (subs === 0) {
    translated(qChannel, 'noSuchSubscription', { screenNames: removedObjectName });
  } else {
    translated(qChannel, 'stopSuccess', {
      screenNames: removedObjectName,
    });
  }
};

const commands = {
  tweet: handleUserTimeline,
  post: handlePost,
  postTranslated: handlePostTranslated,
  start: handleStart,
  stop: handleStop,
  tweetId: handleTweetId,
  announce: handleAnnounce,
};

export default ({ cmd, ...msg }) => {
  const f = commands[cmd];
  if (!f) {
    log(`Slave can't exec unknwn command: ${cmd}`);
    return;
  }
  f(msg);
};
