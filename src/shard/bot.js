import { login, getClient } from './discord';
import log from '../log';
import {
  handleMessage,
  handleError,
  handleGuildCreate,
  handleGuildDelete,
  handleReady,
  handleChannelDelete,
} from './discordEvents';

import handleMasterMsg from './handleMasterMsg';

process.on('unhandledRejection', (err) => {
  log('Unhandled exception:');
  log(err);
});

process.on('message', (msg) => {
  if (!msg.cmd) {
    log('Slave received non-command msg:');
    log(msg);
    return;
  }
  handleMasterMsg(msg);
});

const start = async () => {
  // Register discord handles
  getClient()
    .on('message', handleMessage)
    .on('error', handleError)
    .on('guildCreate', handleGuildCreate)
    .on('guildDelete', handleGuildDelete)
    .on('ready', handleReady)
    .on('channelDelete', handleChannelDelete);
  // Login
  login();
};

start();
