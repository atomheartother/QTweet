import { CmdFn } from ".";
import log from "../../log";
import { getChannelSubs } from "../../db/subs";
import { translated } from "../post";
import QChannel, { isQCSupportedChannel } from "../QChannel/QChannel";
import { rmChannel } from "../../db/channels";

const stopchannel: CmdFn = async ({ args }, qChannel) => {
    let targetChannel = qChannel.id;
    let channelName = await qChannel.name();
    if (args.length > 0) {
      if (qChannel.isDM) {
        translated(qChannel, 'stopChannelInDm');
        return;
      }
      const guild = await qChannel.guild();
      [targetChannel] = args;
      const channelObj = guild.channels.cache.find((c) => c.id === targetChannel);
      if (!channelObj || (!isQCSupportedChannel(channelObj))) {
        translated(qChannel, 'noSuchChannel', { targetChannel });
        return;
      }
      channelName = await new QChannel(channelObj).name();
    }
    const subs = await getChannelSubs(targetChannel);
    await rmChannel(targetChannel);
    log(
      `Removed all gets from channel ID:${targetChannel}. ${subs.length} subs removed.`,
      qChannel,
    );
    translated(qChannel, 'stopChannelSuccess', { subs: subs.length, channelName });
};

export default stopchannel;