import DBL from 'dblapi.js';
import { getClient } from './discord';
import log from '../log';

let dblClient = null;

const postDblStats = async () => {
  const dClient = getClient();
  if (!dClient.shard) {
    log('❌ DBL: Tried to post stats but we don\'t have a shard object');
    return;
  }
  if (dClient.shard.ids.length < 1) {
    log('❌ DBL: 0 shards in dClient.shard.ids');
    return;
  }

  if (dClient.shard.ids.length > 1) {
    log('⚙️ DBL: We have more than 1 ID in this shard...');
    log(dClient.shard.ids);
  }
  dblClient.postStats(
    dClient.guilds.cache.array().length,
    dClient.shard.ids[0],
    dClient.shard.count,
  );
};

export default () => {
  // Already initialized?
  if (dblClient) return;
  dblClient = process.env.DBL_TOKEN !== ''
    ? new DBL(process.env.DBL_TOKEN, getClient())
    : null;
  if (dblClient) {
    console.log('✅ DBL client initialized');
    dblClient.on('error', ({ status }) => {
      log(`❌ DBL: Error with status ${status}`);
    });
    setInterval(postDblStats, 1800000);
  }
};
