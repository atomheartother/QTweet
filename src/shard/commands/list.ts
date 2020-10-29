import { CmdFn } from ".";
import { getChannelSubs, getLang } from "../../subs";
import { formatSubsList } from "../format";
import { embeds, translated } from "../post";

const list: CmdFn = async (_, qChannel) => {
    const gid = qChannel.guildId();
    const [subs, lan] = await Promise.all([getChannelSubs(qChannel.id, true), getLang(gid)]);
    const { cmd: command, ...data } = await formatSubsList(qChannel.serialize(), subs, lan);
    if (command === 'postList') {
      const { embeds: pages } = data;
      embeds(qChannel, pages);
    } else {
      const { trCode, ...options } = data;
      translated(qChannel, trCode, options);
    }
};

export default list;