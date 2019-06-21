// A module for formatting data for displaying

import Discord from "discord.js";
import * as config from "../config.json";
import * as users from "./users";
import { embed as postEmbed, message as postMessage } from "./post";
import { getUser } from "./discord";

const defaults = {
  data: [],
  formatTitle: () => "",
  formatField: () => "",
  description: null,
  noElements: "List is empty, nothing to display.",
  objectName: "objects",
  color: 0xf26d7a
};

export const formatQChannel = async qChannel => {
  const obj = await qChannel.obj();
  let res = `**${qChannel.formattedName}**\n`;
  if (qChannel.type === "dm") {
    res += `**ID:** ${qChannel.id}\n`;
    res += `**CID:** ${obj.id}`;
  } else {
    const owner = getUser(qChannel.oid);
    const guild = qChannel.guild();
    res += `**ID:** ${qChannel.id}\n`;
    res += `**Own:** ${owner.tag} (${qChannel.oid})\n`;
    res += `**Gld:** ${guild.name} (${qChannel.gid}), ${
      guild.memberCount
    } members`;
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
    embed.addField(formatTitle(elem, params), formatField(elem, params));
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

export const formatTwitterUserShort = userId => {
  const twitterUser = users.collection[userId];
  return twitterUser.name
    ? `@${twitterUser.name} (https://twitter.com/${twitterUser.name})`
    : userId;
};

export const formatFlags = flags =>
  `With ${flags.notext ? "no text posts" : "text posts"}, ${
    flags.retweet ? "retweets" : "no retweets"
  }, ${flags.noquote ? "no quotes" : "quotes"}, pings ${
    flags.ping ? "on" : "off"
  }`;

export const formatTwitterUser = (qChannel, id) => {
  const tUser = users.collection[id];
  formatGenericList(qChannel, {
    data: tUser.subs,
    formatTitle: ({ qChannel }) => qChannel.name,
    formatField: ({ qChannel, flags }) =>
      `**ID:** ${qChannel.id}\n**Type:** ${
        qChannel.type === "dm" ? "dm" : "serv"
      } (${formatFlags(flags)})`,
    noElements: `**This user has no subs**\nThis shouldn't happen`,
    objectName: "subscriptions"
  });
};

export const formatChannelList = async (qChannel, targetChannel) => {
  formatGenericList(qChannel, {
    data: users.getChannelGets(targetChannel.id),
    formatTitle: ({ userId }) => formatTwitterUserShort(userId),
    formatField: ({ userId, flags }) =>
      `**ID:** ${userId}\n${formatFlags(flags)}`,
    noElements: `**You're not subscribed to anyone**\nUse \`${
      config.prefix
    }start <screen_name>\` to get started!`,
    objectName: "subscriptions"
  });
};
