import {
  userTimeline, showTweet, createStream,
} from './twitter';
import log from './log';

const validCommands = {
  userTimeline,
  showTweet,
  createStream,
};

export const sendTweetToChannel = () => {

};

export const handleMessage = async (shard, { qc, cmd, ...msg }) => {
  if (!msg.cmd) {
    log('Master received non-command message:');
    log(msg);
    return;
  }
  const commandFunction = validCommands[cmd];
  if (!commandFunction) {
    log(`Can't dispatch unknwn command: ${cmd}`);
    return;
  }
  const res = await commandFunction(msg);
  if (res) {
    shard.send({
      qc, cmd, msg, res,
    });
  }
};
