export default async (message, qChannel = null) => {
  const dateString = new Date().toLocaleString('en-GB');
  if (qChannel) {
    const obj = await qChannel.obj();
    const channelInfo = `[${
      obj
        ? await qChannel.formattedName()
        : `${qChannel.id} -- ${qChannel.isDM}`
    }]`;
    // eslint-disable-next-line no-console
    console.log(`${dateString}:${channelInfo}`, message);
  } else {
    // eslint-disable-next-line no-console
    console.log(dateString, message);
  }
};
