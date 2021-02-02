import { ShardingManager } from 'discord.js';
import log from '../log';
import { QCSerialized } from '../shard/QChannel/type';

let manager: ShardingManager = null;
try {
  manager = new ShardingManager('dist/src/shard/bot.js', { token: process.env.DISCORD_TOKEN, execArgv: ['-r', 'esm'] });
} catch (e) {
  log("Can't create manager");
  log(e);
}

export default manager;

// Does one of our shard have this channel??? :O
export const someoneHasChannel = async ({ channelId, isDM }) => {
  if (!isDM) {
    const res = await manager.broadcastEval(`!!this.channels.resolve("${channelId}")`);
    return res.indexOf(true) !== -1;
  }
  return true;
};

// Send a message to all shards, telling them to post it to every channel they can
export const postAnnouncement = (msg: string, channels) => {
  manager.broadcast({
    cmd: 'announce',
    msg,
    channels,
  });
};

// Send a message to shards and let them figure out which shard should get it
export const post = (qc: QCSerialized, content: any, type) => {
  manager.broadcast({
    cmd: 'post', qc, content, type,
  });
};
