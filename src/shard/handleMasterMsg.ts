import log from '../log';
import { handleUserTimeline as tweet } from './commands/tweet';
import { handleTweetId as tweetId } from './commands/tweetId';
import { handleAnnounce as announce } from './commands/announce';
import { handleStart as start } from './commands/start';
import { handleStop as stop } from './commands/stop';
import { post, translated } from './post';
import QChannel from './QChannel/QChannel';

const handlePost = async ({ qc, content, type }) => {
  // This command can be broadcast to all shards, we must check that it's valid
  const qChannel = QChannel.unserialize(qc);
  try {
    if (!(await qChannel.obj())) return;
  } catch(e) {
    return
  }
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

const commands = {
  tweet,
  post: handlePost,
  postTranslated: handlePostTranslated,
  start,
  stop,
  tweetId,
  announce,
};

export default ({ cmd, ...msg }) => {
  const f = commands[cmd];
  if (!f) {
    log(`Slave can't exec unknwn command: ${cmd}`);
    return;
  }
  f(msg);
};
