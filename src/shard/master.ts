import { getClient } from './discord/discord';

const clientShard = getClient().shard;

export const cmd = (command: string, args: any) => {
  clientShard.send({ ...args, cmd: command });
};

export const createStream = () => {
  clientShard.send({ cmd: 'createStream' });
};

export const destroyStream = () => {
  clientShard.send({ cmd: 'destroyStream' });
};
