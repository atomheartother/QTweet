import { CmdFn } from ".";
import { getChannelSubs, getLang } from "../../subs";
import { formatSubsList, FORMAT_POST_EMBEDS, FORMAT_POST_TRANSLATED } from "../format";
import { embeds, translated } from "../post";

const list: CmdFn = async (_, qChannel) => {
    const gid = qChannel.guildId();
    const [subs, lan] = await Promise.all([getChannelSubs(qChannel.id, true), getLang(gid)]);
    const fmtResult = await formatSubsList(qChannel.serialize(), subs, lan);
    if (fmtResult.cmd === FORMAT_POST_EMBEDS) {
      const { embeds: pages } = fmtResult;
      embeds(qChannel, pages);
    } else {
      const { trCode } = fmtResult;
      translated(qChannel, trCode);
    }
};

export default list;