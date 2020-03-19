const guildInfo = async (args, qc) => {
  const gid = args.shift();
  if (!gid) {
    postTranslated(qChannel, 'usage-admin-guild');
    return;
  }
  const subs = await getGuildSubs(gid);
  formatSubsList(qChannel, subs);
};

const channelInfo = async (args, qc) => {
  const channelId = args.shift();
  if (!channelId) {
    postTranslated(qChannel, 'usage-admin-channel');
    return;
  }
  let qc = null;
  if (getChannel(channelId)) {
    qc = QChannel.unserialize({ channelId, isDM: false });
  } else {
    qc = QChannel.unserialize({ channelId, isDM: true });
  }
  if (!qc || !(await qc.obj())) {
    postTranslated(qChannel, 'adminInvalidId', { channelId });
    return;
  }
  const info = await formatQChannel(qc);
  postMessage(qChannel, info);
  const subs = await getChannelSubs(qc.channelId, true);
  formatSubsList(qChannel, subs);
};

const twitterInfo = async (args, qc) => {
  const screenName = args.shift();
  if (!screenName) {
    return {
        cmd: 'postTranslated',
        qc,
        trCode: 'usage-admin-twitter',
      };
  }
  const user = await getUserFromScreenName(screenName);
  if (!user) {
    return {
        cmd: 'postTranslated',
        qc,
        trCode: 'adminInvalidTwitter',
        screenName
      };
  }
  formatTwitterUser(qChannel, user.twitterId);
};

export default (args, qc) => {
  const verb = args.shift();
  switch (verb[0]) {
    case 'c':
      return channelInfo(args, qc);
    case 't':
      return twitterInfo(args, qc);
    case 'g':
      return guildInfo(args, qc);
    default: {
      return {
        cmd: 'postTranslated',
        qc,
        trCode: 'invalidVerb',
        verb,
      };
    }
  }
};
