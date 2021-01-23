import { CmdFn } from '.';
import { compute as computeFlags } from '../../flags';
import log from '../../log';
import { cmd } from '../master';
import { translated } from '../post';
import QChannel from '../QChannel/QChannel';
import { formatScreenNames, getScreenName } from './helpers';

export const handleStart = async ({ qc, res: { data, results }, msg: { screenNames } }) => {
  const qChannel = QChannel.unserialize(qc);
  const screenNamesFinal = data.map(({
    screen_name: screenName,
  }) => `@${screenName}`);
  const nameCount = screenNamesFinal.length;
  const lastName = screenNamesFinal.pop();
  const addedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  if (results.find(({ subs }) => subs !== 0)) {
    translated(qChannel, 'startSuccess', {
      addedObjectName,
      nameCount,
      firstName: lastName,
      missedNames: screenNames.length !== nameCount ? 1 : 0,
    });
  } else {
    translated(qChannel, 'startUpdateSuccess', {
      addedObjectName,
    });
  }
  log(`Added ${addedObjectName}`, qChannel);
};


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