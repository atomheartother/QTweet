// A module for formatting data for displaying

import Discord from "discord.js";
import * as config from "../config.json";
import { getChannelSubs, getUserSubs, getUserIds } from "./subs";
import { embed as postEmbed, message as postMessage } from "./post";
import { getUser } from "./discord";
import { isSet } from "./flags";
import { getUserInfo } from "./sqlite.js";
import QChannel from "./QChannel.js";

const defaults = {
  data: [],
  formatTitle: () => "",
  formatField: () => "",
  description: null,
  noElements: "List is empty, nothing to display.",
  objectName: "objects",
  color: 0x0e7675
};

export const formatQChannel = async qChannel => {
  const obj = await qChannel.obj();
  let res = `**${await qChannel.formattedName()}**\n`;
  if (qChannel.isDM) {
    res += `**ID:** ${qChannel.id}\n`;
    res += `**CID:** ${obj.id}`;
  } else {
    const owner = await qChannel.owner();
    const guild = await qChannel.guild();
    res += `**ID:** ${qChannel.id}\n`;
    res += `**Own:** ${owner.tag} (${owner.id})\n`;
    res += `**Gld:** ${guild.name} (${guild.id}), ${guild.memberCount} members`;
  }
  return res;
};

export const formatGenericList = async (
  qChannel,
  {
    data = defaults.data,
    formatTitle = defaults.formatTitle,
    formatField = defaults.formatField,
    description = defaults.description,
    noElements = defaults.noElements,
    objectName = defaults.objectName,
    color = defaults.color,
    params = {}
  } = {}
) => {
  if (data.length === 0) {
    postMessage(qChannel, noElements);
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(color)
    .setTitle(`${data.length} ${objectName}:`)
    .setURL(config.profileURL);
  if (description) {
    embed.setDescription(description);
  }
  let counter = 0;
  for (let i = 0; i < data.length; i++) {
    const elem = data[i];
    embed.addField(
      await formatTitle(elem, params),
      await formatField(elem, params)
    );
    counter++;
    if (counter > 20) {
      page++;
      postEmbed(qChannel, { embed });
      embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(`${data.length} ${objectName} (p.${page}):`)
        .setURL(config.profileURL);
      counter = 0;
    }
  }
  if (counter > 0) {
    postEmbed(qChannel, { embed });
  }
};

export const formatTwitterUserShort = name =>
  `@${name} (https://twitter.com/${name})`;

export const formatFlags = flags =>
  `With ${isSet(flags, "notext") ? "no text posts" : "text posts"}, ${
    isSet(flags, "retweet") ? "retweets" : "no retweets"
  }, ${isSet(flags, "noquote") ? "no quotes" : "quotes"}, pings ${
    isSet(flags, "ping") ? "on" : "off"
  }`;

export const formatTwitterUser = async (qChannel, id) => {
  const subs = await getUserSubs(id);
  const subsWithQchannels = [];
  for (let i = 0; i < subs.length; i++) {
    const { channelId, flags, isDM } = subs[i];
    subsWithQchannels.push({
      flags,
      qChannel: QChannel.unserialize({ channelId, isDM })
    });
  }
  formatGenericList(qChannel, {
    data: subsWithQchannels,
    formatTitle: async ({ qChannel }) => await qChannel.name(),
    formatField: async ({ flags, qChannel }) =>
      `**ID:** ${qChannel.id}\n**Type:** ${qChannel.isDM ? "dm" : "serv"}\n${
        qChannel.isDM
          ? ""
          : `**Gld:** ${await qChannel.guildId()}\n**Own:** ${await qChannel.ownerId()}\n`
      }${formatFlags(flags)}`,
    noElements: `**This user has no subs**\nThis shouldn't happen`,
    objectName: "subscriptions"
  });
};

export const formatChannelList = async (qChannel, targetChannel) => {
  const subs = await getChannelSubs(targetChannel.id, true);
  formatGenericList(qChannel, {
    data: subs,
    formatTitle: ({ name }) => formatTwitterUserShort(name),
    formatField: ({ twitterId, flags }) =>
      `**ID:** ${twitterId}\n${formatFlags(flags)}`,
    noElements: `**You're not subscribed to anyone**\nUse \`${
      config.prefix
    }start <screen_name>\` to get started!`,
    objectName: "subscriptions"
  });
};
