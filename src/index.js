import { init as initDb, sanityCheck } from './subs';
import shardMsgHandler from './shardMsgHandler';
import manager from './shardManager';
import log from './log';

const shardReady = async () => {
  if (!manager.shards.every((shard) => shard.ready)) return;
  // All shards are ready, start taking messages
  manager.on('message', (shard, msg) => {
    if (msg.cmd) {
      shardMsgHandler(shard, msg);
    }
  });
  await initDb();
  await sanityCheck();
};

const start = async () => {
  manager.on('launch', (shard) => {
    log(`Launched shard ${shard.id}...`);
    shard.on('ready', shardReady);
  });
  manager.spawn();
};

start();
