import { ShardingManager } from 'discord.js';
import { QCSerialized } from '../shard/QChannel/type';

let manager: ShardingManager = new ShardingManager('src/shard/bot.js', { token: process.env.DISCORD_TOKEN, execArgv: ['-r', 'esm'] });

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
