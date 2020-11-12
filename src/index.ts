import { init as initDb } from './subs';
import { sanityCheck } from './twitter';
import shardMsgHandler from './shardMgr/shardMsgHandler';
import manager from './shardMgr/shardManager';
import log from './log';

const shardReady = async () => {
  if (manager.shards.size !== manager.totalShards
    || !manager.shards.every((shard) => shard.ready)) return;
  log('✅ All shards are ready!');
  // All shards are ready, start taking messages
  manager.shards.each((shard) => shard.on('message', (msg) => {
    if (msg.cmd) {
      shardMsgHandler(shard, msg);
    }
  }));
  initDb();
  log('✅ Connection to database successful');
  sanityCheck();
};

process.on('beforeExit', (code) => {
  log(`Main thread exiting with code ${code}`);
});

const start = async () => {
  manager.on('shardCreate', (shard) => {
    log(`⚙️ Launched shard ${shard.id}...`);
    shard.on('ready', shardReady);
  });
  manager.spawn('auto', Number(process.env.SHARD_SPAWN_DELAY || 15000), Number(process.env.SHARD_SPAWN_TIMEOUT || 60000));
};

start();
