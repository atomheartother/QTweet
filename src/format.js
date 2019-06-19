// A module for formatting data for displaying

module.exports = format = {};

const Discord = require("discord.js");
const users = require("./users");
const config = require("../config.json");
const post = require("./post");
const discord = require("./discord");

const defaults = {
  data: [],
  formatTitle: () => "",
  formatField: () => "",
  noElements: "List is empty, nothing to display.",
  objectName: "objects",
  color: 0xf26d7a
};

format.qChannel = async qChannel => {
  const obj = await qChannel.obj();
  let res = `**${qChannel.formattedName}**\n`;
  if (qChannel.type === "dm") {
    res += `**ID:** ${qChannel.id}\n`;
    res += `**CID:** ${obj.id}`;
  } else {
    const owner = discord.getUser(qChannel.oid);
    const guild = qChannel.guild();
    res += `**ID:** ${qChannel.id}\n`;
    res += `**Own:** ${owner.tag} (${qChannel.oid})\n`;
    res += `**Gld:** ${guild.name} (${qChannel.gid}), ${
      guild.memberCount
    } members`;
  }
  return res;
};

format.genericList = async (
  qChannel,
  {
    data = defaults.data,
    formatTitle = defaults.formatTitle,
    formatField = defaults.formatField,
    noElements = defaults.noElements,
    objectName = defaults.objectName,
    color = defaults.color,
    params = {}
  } = {}
) => {
  if (data.length === 0) {
    qChannel.send(noElements);
  }
  let page = 1;
  let embed = new Discord.RichEmbed()
    .setColor(color)
    .setTitle(`${data.length} ${objectName}:`)
    .setURL(config.profileURL);
  let counter = 0;
  for (let i = 0; i < data.length; i++) {
    const elem = data[i];
    embed.addField(formatTitle(elem, params), formatField(elem, params));
    counter++;
    if (counter > 20) {
      page++;
      post.embed(qChannel, { embed }, false);
      embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(`${data.length} ${objectName} (p.${page}):`)
        .setURL(config.profileURL);
      counter = 0;
    }
  }
  if (counter > 0) {
    post.embed(qChannel, { embed }, false);
  }
};

format.twitterUserShort = userId => {
  const twitterUser = users.collection[userId];
  return twitterUser.name ? `${twitterUser.name} (${userId})` : userId;
};

format.channelList = async (qChannel, targetChannel) => {
  format.genericList(qChannel, {
    data: users.getChannelGets(targetChannel.id),
    formatTitle: ({ userId }) => format.twitterUserShort(userId),
    formatField: ({ text }) => (text ? "With text posts" : "No text posts"),
    noElements: `**You're not subscribed to anyone**\nUse \`${
      config.prefix
    }start <screen_name>\` to get started!`,
    objectName: "subscriptions"
  });
};
