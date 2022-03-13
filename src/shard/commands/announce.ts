import {DbChannel} from "../../db/channels";
import { CmdFn } from ".";
import { cmd } from "../master";
import { announcement } from "../post";
import QChannel from "../QChannel/QChannel";

export const handleAnnounce = async ({ channels, msg }) => {
    const qChannelPromises = channels.map((channel: DbChannel) => {
      const qc = QChannel.unserialize(channel);
      return qc.obj();
    });
    const qChannelsObjs = await Promise.all(qChannelPromises);
    announcement(msg, channels.filter((c, index) => !!qChannelsObjs[index]));
  };
  
const announce : CmdFn = async ({ args }) => {
    const msg = args.join(' ');
    cmd('announce', { msg });
};

export default announce;
