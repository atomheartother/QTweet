import QChannel from "./shard/QChannel/QChannel";

export default async (message: any, qChannel: QChannel = null, verbose = false) => {
  // Only let through verbose messages in verbose mode
  if (verbose === true && Number(process.env.VERBOSE) !== 1) return;
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
