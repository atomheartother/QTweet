import { getClient } from './discord';
import log from '../log';

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

export const userTimeline = (params, qc) => {
  clientShard.send({
    cmd: 'userTimeline',
    params,
    qc,
  });
};

export const showTweet = (tweetId, qc) => {
  clientShard.send({
    cmd: 'showTweet',
    params: tweetId,
    qc,
  });
};

export const userLookup = (tweetId, qc) => {
  clientShard.send({
    cmd: 'showTweet',
    tweetId,
    qc,
  });
};
