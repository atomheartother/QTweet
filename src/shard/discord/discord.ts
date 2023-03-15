// Direct mappings for discord.js methods
import { Permissions, AnyChannel, TextChannel, GuildChannel, DMChannel, NewsChannel, Intents, ThreadChannel } from 'discord.js';
import log from '../../log';
import Backup from '../../backup';
import { Client } from './clientType';

let dClient: Client = null;

export const init = () => {
  try {
    const intents = new Intents();
    intents.add('GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES')
    dClient = new Client({
      messageCacheLifetime: 30,
      messageSweepInterval: 60,
      restGlobalRateLimit: 5,
      intents,
      partials: ['CHANNEL'],
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

export const isDmChannel = (c: AnyChannel): c is DMChannel => c.type === 'DM';
export const isTextChannel = (c: AnyChannel): c is TextChannel | NewsChannel | ThreadChannel => c.type === 'GUILD_TEXT' || c.type === 'GUILD_NEWS' || c.type === "GUILD_PUBLIC_THREAD" || c.type === "GUILD_PRIVATE_THREAD" || c.type === 'GUILD_NEWS_THREAD';
export const isNewsChannel = (c: AnyChannel): c is NewsChannel => c.type === 'GUILD_NEWS';
export const isThreadChannel = (c: AnyChannel): c is ThreadChannel => c.type === "GUILD_PRIVATE_THREAD" || c.type === "GUILD_PUBLIC_THREAD";

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
}

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
  return permissions.has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL]);
};

export const canPostEmbedIn = (channel: GuildChannel) => {
  if (!channel) return false;
  const permissions = channel.permissionsFor(dClient.user);
  return permissions.has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.ATTACH_FILES]);
};
