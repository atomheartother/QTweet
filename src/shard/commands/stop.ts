import { CmdFn } from ".";
import { cmd } from "../master";
import { translated } from "../post";
import QChannel from "../QChannel/QChannel";
import { formatScreenNames, getScreenName } from "./helpers";

export const handleStop = async ({ qc, res: { data, subs } }) => {
  const qChannel = QChannel.unserialize(qc);
  const screenNamesFinal = data.map(({ screen_name: screenName }) => `@${screenName}`);
  const lastName = screenNamesFinal.pop();
  const removedObjectName = await formatScreenNames(
    qChannel,
    screenNamesFinal,
    lastName,
  );
  if (subs === 0) {
    translated(qChannel, 'noSuchSubscription', { screenNames: removedObjectName });
  } else {
    translated(qChannel, 'stopSuccess', {
      screenNames: removedObjectName,
    });
  }
};


const stop: CmdFn = async ({ args }, qChannel) => {
    const screenNames = args.map(getScreenName);
    if (screenNames.length < 1) {
      translated(qChannel, 'usage-stop');
      return;
    }
    cmd('stop', { screenNames, qc: qChannel.serialize() });
};

export default stop;