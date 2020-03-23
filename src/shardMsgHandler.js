import {
  userTimeline, createStream,
} from './twitter';
import {
  start, tweetId, stop, announce,
} from './botCommands';
import log from './log';

const validCommands = {
  userTimeline,
  tweetId,
  createStream,
  start,
  stop,
  announce,
};

export default async (shard, { cmd, ...msg }) => {
  const commandFunction = validCommands[cmd];
  if (!commandFunction) {
    log(`Can't dispatch unknwn command: ${cmd}`);
    return;
  }
  const res = await commandFunction(msg);
  if (res) {
    shard.send({
      cmd: res.cmd || cmd, qc: res.qc || msg.qc, msg, res,
    });
  }
};
