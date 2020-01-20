// Helper class to interact with channels and keep memory down
import {
  getUserDm,
  getChannel,
  canPostIn,
  getGuild,
  canPostEmbedIn,
} from './discord';

const getChannelName = (c) => {
  if (c.type === 'dm') {
    return `${c.recipient.tag}`;
  }
  return `#${c.name}`;
};

const getFormattedName = (c) => {
  if (c.type === 'dm') {
    return `DM: ${c.recipient.tag} -- ${c.recipient.id}`;
  }
  return `#${c.name} -- ${c.guild.name} -- ${c.id}`;
};

class QChannel {
  // Created from a discord channel object
  constructor({ id, type, recipient }) {
    // Check validity of object
    this.id = type === 'dm' && recipient ? recipient.id : id;
    this.isDM = type === 'dm';
  }

  async formattedName() {
    return getFormattedName(await this.obj());
  }

  async name() {
    return getChannelName(await this.obj());
  }

  // Returns a js channel object
  async obj() {
    if (this.isDM) {
      return getUserDm(this.id);
    }
    return getChannel(this.id);
  }

  ownerId() {
    if (this.isDM) return this.id;
    return getChannel(this.id).guild.ownerID;
  }

  guildId() {
    if (this.isDM) return this.id;
    return getChannel(this.id).guild.id;
  }

  // Return a direct channel to the owner of this qChannel
  async owner() {
    if (this.isDM) {
      return getUserDm(this.id);
    }
    return getUserDm(await this.ownerId());
  }

  async send(content, options = null) {
    const c = await this.obj();
    return c.send(content, options);
  }

  async sendToOwner(content, options = null) {
    const c = await this.owner();
    return c.send(content, options);
  }

  // Returns a raw Discord guild object
  async guild() {
    if (this.isDM) {
      return null;
    }
    return getGuild(this.guildId());
  }

  static async bestGuildChannel(guild, msgType = 'message') {
    if (!guild) return null;
    const checkFunction = msgType === 'embed' ? canPostEmbedIn : canPostIn;
    // Check the system channel
    if (guild.systemChannelID) {
      const sysChan = getChannel(guild.systemChannelID);
      if (sysChan && checkFunction(sysChan)) return new QChannel(sysChan);
    }

    // Check #general
    const genChan = guild.channels.find(
      (c) => c.type === 'text' && c.name === 'general',
    );
    if (genChan && checkFunction(genChan)) return new QChannel(genChan);

    // Iterate over all channels and find the first best one
    const firstBest = guild.channels.find(
      (c) => c.type === 'text' && checkFunction(c),
    );
    if (firstBest) return new QChannel(firstBest);
    // Try to reach the owner, this might fail, we'll return null here if all fails
    const dm = await getUserDm(guild.ownerID);
    if (dm) return new QChannel(dm);
    return null;
  }

  // Best channel starting from this channel
  // Can return null
  async bestChannel(msgType = 'message') {
    const c = await this.obj();
    const checkFunction = msgType === 'embed' ? canPostEmbedIn : canPostIn;
    if (this.isDM || checkFunction(c)) {
      return this;
    }
    // From now on we can't post in this channel
    return QChannel.bestGuildChannel(await this.guild(), msgType);
  }

  serialize() {
    return {
      id: this.id,
      isDM: this.isDM,
    };
  }

  static unserialize({ channelId, isDM }) {
    return new QChannel({ id: channelId, type: isDM ? 'dm' : 'text' });
  }
}

export default QChannel;
