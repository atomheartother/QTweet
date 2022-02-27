import { Client, ShardingManager } from 'discord.js';
import log from '../log';
import { QCSerialized } from '../shard/QChannel/type';

let manager: ShardingManager = null;

export const init = (): ShardingManager => {
  try {
    manager = new ShardingManager('dist/shard/bot.js', { token: process.env.DISCORD_TOKEN, execArgv: ['--es-module-specifier-resolution=node'] });
    return manager;
  } catch (e) {
    log("Can't create manager");
    log(e);
    return null;
  }
}

export const mgr = (): ShardingManager => manager;

const hasChannel = (c: Client, { channelId }): boolean => {
  return !!c.channels.resolve(channelId);
}

// Does one of our shard have this channel??? :O
export const someoneHasChannel = async ({ channelId, isDM }) => {
  if (!isDM) {
    const res = await manager.broadcastEval(hasChannel, { context: {channelId} });
    return res.indexOf(true) !== -1;
  }
  return true;
};

// Send a message to all shards, telling them to post it to every channel they can
export const postAnnouncement = (msg: string, channels: {channelId: string; ownerId: string; guildId: string; isDM: boolean;}[]) => {
  manager.broadcast({
    cmd: 'announce',
    msg,
    channels,
  });
};

// Send a message to shards and let them figure out which shard should get it
export const post = (qc: QCSerialized, content: any, type: string) => {
  if (qc.isDM) {
    manager.shards.at(0).send({cmd: 'post', qc, content, type});
    return;
  }
  manager.broadcast({
    cmd: 'post', qc, content, type,
  });
};
