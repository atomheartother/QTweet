import { userTimeline, showTweet } from './twitter';
import log from './log';

const validCommands = {
  userTimeline,
  showTweet,
};

export default async ({ cmd, ...msg }) => {
  const commandFunction = validCommands[cmd];
  if (!commandFunction) {
    log(`Can't dispatch unknwn command: ${cmd}`);
    return null;
  }
  const res = await commandFunction(msg);
  return { cmd, msg, res };
};
