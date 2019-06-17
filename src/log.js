module.exports = (message, qChannel = null) => {
  const dateString = new Date().toLocaleString("en-GB");
  let channelInfo = qChannel ? `[${qChannel.formattedName}]` : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
