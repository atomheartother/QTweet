// Helper class to interact with channels and keep memory down
import { AnyChannel, DMChannel, Guild, GuildChannel, MessageOptions, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import {
  getUserDm,
  getChannel,
  canPostIn,
  getGuild,
  canPostEmbedIn,
  isDmChannel,
  isTextChannel,
  isThreadChannel,
} from '../discord/discord';
import { QCConstructor, QCSerialized, QCSupportedChannel } from './type'

export const isQCSupportedChannel = (c: AnyChannel): c is QCSupportedChannel  => isTextChannel(c) || isDmChannel(c);

const checkFunction = ((channel: NewsChannel | ThreadChannel | TextChannel, msgType: string) => {
  const gChannel: GuildChannel = isThreadChannel(channel) ? channel.parent : channel;
  return msgType === 'embed' ? canPostEmbedIn(gChannel) : canPostIn(gChannel);
})

const getChannelName = (c: AnyChannel) => {
  if (isDmChannel(c)) {
    return `${c.recipient.tag}`;
  }
  else if (isTextChannel(c)) {
    return `#${c.name}`;
  }
  return `CHNL:${c.id}`;
};

const getFormattedName = (c: AnyChannel) => {
  if (isDmChannel(c)) {
    return `DM: ${c.recipient.tag} -- ${c.recipient.id}`;
  }
  if (isThreadChannel(c)) {
    return `Thread: ${c.name} (${c.id}) in ${c.parent.name} (${c.parentId})`
  }
  if (isTextChannel(c)) {
    return `#${c.name} -- ${c.guild.name} -- ${c.id}`;
  }
  return `Channel: ${c.id}`
};

class QChannel {
  id: string;
  isDM: boolean;

  // Created from a discord channel object
  constructor({ id, type, recipient }: QCConstructor) {
    // Check validity of object
    this.id = type === 'DM' && recipient ? recipient.id : id;
    this.isDM = type === 'DM';
  }

  async formattedName(): Promise<string> {
    return getFormattedName(await this.obj());
  }

  async name(): Promise<string> {
    return getChannelName(await this.obj());
  }

  // Returns a js channel object
  // Null indicates the channel doesn't exist or isn't supported
  async obj(): Promise<QCSupportedChannel|null> {
    if (this.isDM) {
      return getUserDm(this.id);
    }
    const c = getChannel(this.id);
    if (!!c && isTextChannel(c)) {
      return c;
    }
    return null;
  }

  ownerId(): string {
    if (this.isDM) return this.id;
    const c = getChannel(this.id);
    if (isTextChannel(c)) {
      return c.guild.ownerId;
    }
    throw new Error(`Tried to get ownerId for an unsupported channel: ${this.id}, ${c.type}`)
  }

  guildId(): string {
    if (this.isDM) return this.id;
    const c = getChannel(this.id);
    if (isTextChannel(c)) {
      return c.guild.id
    }
    throw new Error(`Tried to get guildId for unsupported channel: ${this.id}, ${c.type}`)
  }

  // Return a direct channel to the owner of this qChannel
  owner(): Promise<DMChannel> {
    if (this.isDM) {
      return getUserDm(this.id);
    }
    return getUserDm(this.ownerId());
  }

  async send(content: MessageOptions | string) {
    try {
      const c = await this.obj();
      return c && c.send(content);
    }
    catch (e) {
      console.log("Can't send in invalid channel");
      console.log(e);
      console.log(this.id);
      return null;
    }
  }

  async sendToOwner(content: any, options = null) {
    const c = await this.owner();
    return c && c.send(content);
  }

  // Returns a raw Discord guild object
  async guild() {
    if (this.isDM) {
      return null;
    }
    return getGuild(this.guildId());
  }

  static async bestGuildChannel(guild: Guild, msgType = 'message') {
    if (!guild) return null;
    // Check the system channel
    if (guild.systemChannel && checkFunction(guild.systemChannel, msgType)) {
      return new QChannel(guild.systemChannel);
    }

    // Check #general
    // Guaranteed to be a textchannel
    const genChan = guild.channels.cache.find(
      (c) => isTextChannel(c) && c.name === 'general',
    ) as TextChannel;
    if (genChan && checkFunction(genChan, msgType)) return new QChannel(genChan);

    // Iterate over all channels and find the first best one
    const firstBest = guild.channels.cache.find(
      (c) => isTextChannel(c) && checkFunction(c, msgType),
    ) as TextChannel;
    if (firstBest) return new QChannel(firstBest);
    // Try to reach the owner, this might fail, we'll return null here if all fails
    const dm = await getUserDm(guild.ownerId);
    if (dm) return new QChannel(dm);
    return null;
  }

  // Best channel starting from this channel
  // Can return null
  async bestChannel(msgType = 'message') {
    try {
      const c = await this.obj();
      if (isDmChannel(c) || checkFunction(c, msgType)) {
        return this;
      }
      // From now on we can't post in this channel
      return QChannel.bestGuildChannel(await this.guild(), msgType);
    } catch(e) {
      console.log("No bestchannel for invalid channel");
      console.log(e);
      console.log(this.id);
    }
    return null;
  }

  serialize(): QCSerialized {
    return {
      channelId: this.id,
      isDM: this.isDM,
    };
  }

  static unserialize({ channelId, isDM }: QCSerialized): QChannel {
    return new QChannel({ id: channelId, type: isDM ? 'DM' : 'GUILD_TEXT' });
  }
}

export default QChannel;
