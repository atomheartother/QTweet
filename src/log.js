module.exports = (message, qChannel = null) => {
  const dateString = new Date().toLocaleString();
  let channelInfo = qChannel ? `[${qChannel.formattedName}]` : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
