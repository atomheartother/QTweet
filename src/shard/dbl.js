import DBL from 'dblapi.js';
import { getClient } from './discord';
import log from '../log';

let dblClient = null;

export default () => {
  // Already initialized?
  if (dblClient) return;
  dblClient = process.env.DBL_TOKEN !== ''
    ? new DBL(process.env.DBL_TOKEN, getClient())
    : null;
  if (dblClient) {
    log('✅ DBL client initialized');
    dblClient.on('error', ({ status }) => {
      log(`❌ DBL: Error with status ${status}`);
    });
  }
};
