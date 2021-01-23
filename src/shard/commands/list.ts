import { getChannelSubs } from "../../db/subs";
import { CmdFn } from ".";
import { getLang } from "../../db/guilds";
import { formatSubsList, FORMAT_POST_EMBEDS } from "../format";
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