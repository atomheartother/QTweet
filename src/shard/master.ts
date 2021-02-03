import { ShardClientUtil } from 'discord.js';
import { getClient } from './discord/discord';

let clientShard: ShardClientUtil = null;

export const init = () => {
  try {
    clientShard = getClient().shard;
  } catch(e) {
    console.log("Can't get shard for client");
    console.log(e);
  }
}


export const cmd = (command: string, args: any) => {
  clientShard.send({ ...args, cmd: command });
};

export const createStream = () => {
  clientShard.send({ cmd: 'createStream' });
};

export const destroyStream = () => {
  clientShard.send({ cmd: 'destroyStream' });
};
