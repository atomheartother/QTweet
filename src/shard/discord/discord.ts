// Direct mappings for discord.js methods
import { Client, Permissions, Channel, TextChannel, GuildChannel, DMChannel, NewsChannel } from 'discord.js';
import log from '../../log';
import Backup from '../../backup';

let dClient: Client = null;

export const init = () => {
  try {
    dClient = new Client({
      messageCacheMaxSize: 1,
      messageCacheLifetime: 30,
      messageSweepInterval: 60,
    });
  } catch(e) {
    log("Can't initialize discord client");
    log(e);
  }
}

const reconnectionDelay = new Backup({
  mode: 'exponential',
  startValue: 1000,
  maxValue: 60000,
});

export const isDmChannel = (c: Channel): c is DMChannel => c.type === 'dm';
export const isTextChannel = (c: Channel): c is TextChannel => c.type === 'text';
export const isNewsChannel = (c: Channel): c is NewsChannel => c.type === 'news';

export const getClient = () => dClient;

export const login = async () => {
  try {
    log('⚙️ Logging into Discord');
    await dClient.login(process.env.DISCORD_TOKEN);
    reconnectionDelay.reset();
  } catch (err) {
    log("Couldn't log into discord:");
    log(err);
    setTimeout(login, reconnectionDelay.value());
    reconnectionDelay.increment();
  }
};

export const user = () => dClient.user;

export const getChannel = (id: string) => dClient.channels.resolve(id);

export const getGuild = (id: string) => dClient.guilds.resolve(id);

export const getUser = (id: string) => dClient.users.resolve(id);

export const getUserDm = async (id: string) => {
  const usr = dClient.users.resolve(id);
  if (!usr) return null;
  return usr.dmChannel ? usr.dmChannel : usr.createDM();
};

export const canPostIn = (channel: GuildChannel) => {
  if (!channel) return false;
  const permissions = channel.permissionsFor(dClient.user);
  return (
    permissions.has(Permissions.FLAGS.SEND_MESSAGES)
    && permissions.has(Permissions.FLAGS.VIEW_CHANNEL)
  );
};

export const canPostEmbedIn = (channel: GuildChannel) => {
  if (!channel) return false;
  const permissions = channel.permissionsFor(dClient.user);
  return (
    permissions.has(Permissions.FLAGS.SEND_MESSAGES)
    && permissions.has(Permissions.FLAGS.VIEW_CHANNEL)
    && permissions.has(Permissions.FLAGS.EMBED_LINKS)
    && permissions.has(Permissions.FLAGS.ATTACH_FILES)
  );
};
