module.exports = (message, channel = null) => {
  const dateString = new Date().toLocaleString();
  let channelInfo = channel
    ? ` [#${channel.name} -- ${channel.guild.name}]`
    : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
