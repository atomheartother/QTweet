import {
  createStream,
} from '../twitter-v2';
import {
  start, tweet, tweetId, stop, announce,
} from './botCommands';
import log from '../log';
import { Shard } from 'discord.js';
import { MasterResponseMsg, ShardCmd, ShardMsg, ShardMsgHandlerFunction } from '.';

const validCommands : {
  [cmd in ShardCmd]: ShardMsgHandlerFunction<cmd>
} = {
  tweet,
  tweetId,
  createStream,
  start,
  stop,
  announce,
};

const msgHandler = async (shard: Shard, msg: ShardMsg) => {
  const { cmd } = msg;
  const commandFunction : ShardMsgHandlerFunction<typeof cmd> = validCommands[cmd];
  if (!commandFunction) {
    log(`Can't dispatch unknwn command: ${cmd}`);
    return;
  }
  const res = await commandFunction(msg);
  if (res) {
    const masterResponse: MasterResponseMsg<typeof cmd> = {
      cmd: res.cmd || cmd,
      qc: res.qc || (msg.cmd !== 'createStream' && msg.cmd !== 'announce' ? msg.qc : undefined),
      msg,
      res,
    }
    shard.send(masterResponse);
  }
};

export default msgHandler;
