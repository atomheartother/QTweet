import DBL from 'dblapi.js';
import { getClient } from './discord/discord';
import log from '../log';

let dblClient: DBL = null;

export default () => {
  // Already initialized?
  if (dblClient) return;
  dblClient = process.env.DBL_TOKEN !== ''
    ? new DBL(process.env.DBL_TOKEN, getClient())
    : null;
  if (dblClient) {
    log('✅ DBL client initialized');
    dblClient.on('error', (err) => {
      log(`❌ DBL: Error with status ${err.message}`);
    });
  }
};
