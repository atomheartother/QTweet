import { ShardingManager } from 'discord.js';

let manager = null;

export default manager = new ShardingManager('src/shard/bot.js', { token: process.env.DISCORD_TOKEN, execArgv: ['-r', 'esm'] });

// Does one of our shard have this channel??? :O
export const someoneHasChannel = async ({ channelId, isDm }) => {
  if (!isDm) {
    const res = await manager.broadcastEval(`!!this.channels.resolve("${channelId}")`);
    return res.indexOf(true) !== -1;
  }
  return true;
};

// Send a message to shards and let them figure out which shard should get it
export const post = (qc, content, type) => {
  manager.broadcast({
    cmd: 'post', qc, content, type,
  });
};
