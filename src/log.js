export default async (message, qChannel = null) => {
  const dateString = new Date().toLocaleString("en-GB");
  let channelInfo = qChannel ? `[${await qChannel.formattedName()}]` : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
