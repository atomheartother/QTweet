import { init as initDb } from './db';
import { sanityCheck } from './twitter';
import shardMsgHandler from './shardMgr/shardMsgHandler';
import { init as initSharding, mgr } from './shardMgr/shardManager';
import log from './log';

const shardReady = async () => {
  if (mgr().shards.size !== mgr().totalShards
    || !mgr().shards.every((shard) => shard.ready)) return;
  log('✅ All shards are ready!');
  // All shards are ready, start taking messages
  mgr().shards.each((shard) => shard.on('message', (msg) => {
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
  const manager = initSharding();
  if (!manager) return 1;
  manager.on('shardCreate', (shard) => {
    log(`⚙️ Launched shard ${shard.id}...`);
    shard.on('ready', shardReady);
  });
  try {
    log("Spawning shards...");
    manager.spawn('auto', Number(process.env.SHARD_SPAWN_DELAY || 15000), Number(process.env.SHARD_SPAWN_TIMEOUT || 60000));
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