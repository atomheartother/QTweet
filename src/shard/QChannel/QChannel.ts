// Helper class to interact with channels and keep memory down
import { Channel, DMChannel, Guild, GuildChannel, TextChannel } from 'discord.js';
import {
  getUserDm,
  getChannel,
  canPostIn,
  getGuild,
  canPostEmbedIn,
  isDmChannel,
  isTextChannel,
} from '../discord/discord';
import { QCConstructor, QCSerialized, QCSupportedChannel } from './type'

export const isQCSupportedChannel = (c: Channel): c is QCSupportedChannel  => isTextChannel(c) || isDmChannel(c);

const getChannelName = (c: Channel) => {
  if (isDmChannel(c)) {
    return `${c.recipient.tag}`;
  }
  else if (isTextChannel(c)) {
    return `#${c.name}`;
  }
  return `CHNL:${c.id}`;
};

const getFormattedName = (c: Channel) => {
  if (isDmChannel(c)) {
    return `DM: ${c.recipient.tag} -- ${c.recipient.id}`;
  }
  else if (isTextChannel(c)) {
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
    this.id = type === 'dm' && recipient ? recipient.id : id;
    this.isDM = type === 'dm';
  }

  async formattedName(): Promise<string> {
    return getFormattedName(await this.obj());
  }

  async name(): Promise<string> {
    return getChannelName(await this.obj());
  }

  // Returns a js channel object
  async obj(): Promise<QCSupportedChannel> {
    if (this.isDM) {
      return getUserDm(this.id);
    }
    const c = getChannel(this.id);
    if (isTextChannel(c)) {
      return c;
    }
    throw new Error(`Tried to get obj on channel ${this.id}, but it's not supported! It is ${c.type}`)
  }

  ownerId(): string {
    if (this.isDM) return this.id;
    const c = getChannel(this.id);
    if (isTextChannel(c)) {
      return c.guild.ownerID;
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

  async send(content: any, options = null) {
    try {
      const c = await this.obj();
      return c && c.send(content, options);
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
    return c && c.send(content, options);
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
    const checkFunction = msgType === 'embed' ? canPostEmbedIn : canPostIn;
    // Check the system channel
    if (guild.systemChannel && checkFunction(guild.systemChannel)) {
      return new QChannel(guild.systemChannel);
    }

    // Check #general
    // Guaranteed to be a textchannel
    const genChan = guild.channels.cache.find(
      (c) => isTextChannel(c) && c.name === 'general',
    ) as TextChannel;
    if (genChan && checkFunction(genChan)) return new QChannel(genChan);

    // Iterate over all channels and find the first best one
    const firstBest = guild.channels.cache.find(
      (c) => isTextChannel(c) && checkFunction(c),
    ) as TextChannel;
    if (firstBest) return new QChannel(firstBest);
    // Try to reach the owner, this might fail, we'll return null here if all fails
    const dm = await getUserDm(guild.ownerID);
    if (dm) return new QChannel(dm);
    return null;
  }

  // Best channel starting from this channel
  // Can return null
  async bestChannel(msgType = 'message') {
    try {
      const c = await this.obj();
      const checkFunction = msgType === 'embed' ? canPostEmbedIn : canPostIn;
      if (isDmChannel(c) || checkFunction(c)) {
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
    return new QChannel({ id: channelId, type: isDM ? 'dm' : 'text' });
  }
}

export default QChannel;
