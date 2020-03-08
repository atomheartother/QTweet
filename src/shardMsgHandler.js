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
  log(msg);
  const commandResult = await commandFunction(msg);
  if (commandResult) {
    const { cmd: resCmd, ...res } = commandResult;
    shard.send({
      cmd: resCmd || cmd, msg, res,
    });
  }
};
