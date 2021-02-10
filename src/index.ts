import { init as initDb } from './db';
import { sanityCheck } from './twitter';
import shardMsgHandler from './shardMgr/shardMsgHandler';
import { init as initSharding } from './shardMgr/shardManager';
import log from './log';
import manager from './shardMgr/shardManager';

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
  const mgr = initSharding();
  if (!mgr) return 1;
  mgr.on('shardCreate', (shard) => {
    log(`⚙️ Launched shard ${shard.id}...`);
    shard.on('ready', shardReady);
  });
  try {
    log("Spawning shards...");
    mgr.spawn('auto', Number(process.env.SHARD_SPAWN_DELAY || 15000), Number(process.env.SHARD_SPAWN_TIMEOUT || 60000));
  } catch (e) {
    log("Can't spawn shard:");
    log(e);
  }
};
try {
  start();
} catch (e) {
  log(e)
}