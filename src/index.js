import { ShardingManager } from 'discord.js';
import log from './log';
import { init } from './subs';
import dispatchMessage from './shardManager';

const manager = new ShardingManager('src/shard/bot.js', { token: process.env.DISCORD_TOKEN });

const start = async () => {
  await init();
  manager.spawn();
  manager.on('launch', (shard) => log(`Launched shard ${shard.id}`));
  manager.on('message', async (shard, { qc, ...msg }) => {
    if (!msg.cmd) {
      log('Master received non-command message:');
      log(msg);
      return;
    }
    const res = await dispatchMessage(msg);
    if (res) shard.send({ ...res, qc });
  });
};

start();
