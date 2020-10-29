import { CmdFn } from ".";
import { cmd } from "../master";
import { translated } from "../post";
import { getScreenName } from "./helpers";

const stop: CmdFn = async ({ args }, qChannel) => {
    const screenNames = args.map(getScreenName);
    if (screenNames.length < 1) {
      translated(qChannel, 'usage-stop');
      return;
    }
    cmd('stop', { screenNames, qc: qChannel.serialize() });
};

export default stop;