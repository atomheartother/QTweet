import log from '../log';
import { handleUserTimeline } from './commands';

const commands = {
  userTimeline: handleUserTimeline,
};

export default ({ cmd, ...msg }) => {
  const f = commands[cmd];
  if (!f) {
    log(`Slave can't exec unknwn command: ${cmd}`);
    return;
  }
  log(msg.qc);
  f(msg);
};
