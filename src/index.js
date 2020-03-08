import { ShardingManager } from 'discord.js';
import log from './log';
import { init } from './subs';
import { handleMessage } from './shardManager';

const manager = new ShardingManager('src/shard/bot.js', { token: process.env.DISCORD_TOKEN });

const start = async () => {
  await init();
  manager.spawn();
  manager.on('launch', (shard) => log(`Launched shard ${shard.id}`));
  manager.on('message', handleMessage);
};

start();
