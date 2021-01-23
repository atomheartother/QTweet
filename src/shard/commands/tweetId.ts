import QChannel from "../QChannel/QChannel";
import { embed as postEmbed } from '../post'
import log from "../../log";
import { cmd } from "../master";
import { CmdFn } from ".";

export const handleTweetId = async ({ qc, res: { formatted, isQuoted, quoted }, msg: { id } }) => {
    const qChannel = QChannel.unserialize(qc);

    const { embed } = formatted;
    postEmbed(qChannel, embed);
    log(`Posting tweet ${id}`, qChannel);

    if (isQuoted) {
        const { embed: quotedEmbed } = quoted;
        postEmbed(qChannel, quotedEmbed);
    }
};
  
const tweetId: CmdFn = ({ args: [id] }, qChannel) => {
    cmd('tweetId', { id, qc: qChannel.serialize() });
};

export default tweetId;