import { init as initSubs } from './subs';
import shardMsgHandler from './shardMsgHandler';
import manager from './shardManager';
import log from './log';

const start = async () => {
  manager.on('launch', (shard) => log(`Launched shard ${shard.id}`));
  manager.on('message', shardMsgHandler);

  manager.spawn();
  await initSubs();
};

start();
