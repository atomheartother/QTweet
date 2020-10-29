import { CmdFn } from '.';
import { compute as computeFlags } from '../../flags';
import { cmd } from '../master';
import { translated } from '../post';
import { getScreenName } from './helpers';

const start: CmdFn = async ({ args, flags: strFlags, options }, qChannel) => {
    const flags = computeFlags(strFlags);
    const screenNames = args.map(getScreenName);
    if (screenNames.length < 1) {
      translated(qChannel, 'usage-start');
      return;
    }
    const [ownerId, guildId] = await Promise.all([qChannel.ownerId(), qChannel.guildId()]);
    cmd('start', {
      screenNames, flags, qc: { ...qChannel.serialize(), ownerId, guildId }, msg: options.msg,
    });
};

export default start;