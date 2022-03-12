import { init as initDiscord, login, getClient } from './discord/discord';
import { init as initDb } from '../db/index'
import { init as initShard } from './master';
import log from '../log';
import { handleMessage, handleError, handleGuildCreate, handleGuildDelete, handleReady, handleChannelDelete, handleInteraction } from './discord/discordEvents';

import handleMasterMsg from './handleMasterMsg';

process.on('unhandledRejection', (err) => {
  log('Unhandled exception:');
  log(err);
});

process.on('message', (msg: any) => {
  if (msg.cmd) {
    handleMasterMsg(msg);
  }
});

const start = async () => {
  // Init database
  log('⚙️  Initializing database...');
  initDb();
  // Init discord client
  log('⚙️  Creating Discord client...');
  initDiscord();
  initShard();
  // Register discord handles
  getClient()
    .on('message', handleMessage)
    .on('error', handleError)
    .on('guildCreate', handleGuildCreate)
    .on('guildDelete', handleGuildDelete)
    .on('ready', handleReady)
    .on('channelDelete', handleChannelDelete)
    .on('interactionCreate', handleInteraction);
  // Login
  login();
};

start();
