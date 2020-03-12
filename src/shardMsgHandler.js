import {
  userTimeline, createStream,
} from './twitter';
import { start, tweetId, stop } from './botCommands';
import log from './log';

const validCommands = {
  userTimeline,
  tweetId,
  createStream,
  start,
  stop,
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
      cmd: res.cmd || cmd, msg, res,
    });
  }
};
