import { ShardingManager } from 'discord.js';

let manager = null;

export default manager = new ShardingManager('src/shard/bot.js', { token: process.env.DISCORD_TOKEN });

// Send a message to shards and let them figure out which shard should get it
export const post = (qc, content, type) => {
  manager.broadcast({
    cmd: 'post', qc, content, type,
  });
};
