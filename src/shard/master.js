import { getClient } from './discord';

const clientShard = getClient().shard;

export const cmd = (command, args) => {
  clientShard.send({ ...args, cmd: command });
};

export const createStream = () => {
  clientShard.send({ cmd: 'createStream' });
};

export const destroyStream = () => {
  clientShard.send({ cmd: 'destroyStream' });
};
