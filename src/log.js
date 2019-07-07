export default async (message, qChannel = null) => {
  const dateString = new Date().toLocaleString("en-GB");
  const obj = await qChannel.obj();
  let channelInfo = qChannel
    ? `[${obj ? await qChannel.name() : `${qChannel.id} - ${qChannel.isDM}`}]`
    : "";
  console.log(`${dateString}:${channelInfo}`, message);
};
