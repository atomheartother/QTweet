const formatChannelInfo = channel =>
  channel.type !== "dm"
    ? ` [#${channel.name} -- ${channel.guild.name}]`
    : ` [${channel.recipient.username}#${channel.recipient.discriminator}]`;

module.exports = (message, channel = null) => {
  const dateString = new Date().toLocaleString();
  let channelInfo = channel ? formatChannelInfo(channel) : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
