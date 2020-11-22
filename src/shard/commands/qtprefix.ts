import { CmdFn } from ".";
import { setPrefix } from "../../db/guilds";
import { translated } from "../post";

const qtprefix: CmdFn = async ({ args }, qChannel) => {
    const prefix = args.shift();
    setPrefix(qChannel.guildId(), prefix);
    translated(qChannel, 'prefixSuccess', { prefix });
};

export default qtprefix