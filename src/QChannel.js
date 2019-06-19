// Helper class to interact with channels and keep memory down
const discord = require("./discord");
const log = require("./log");

// Some selectors
const getType = c => c.type;
const getName = c => {
  if (c.type === "dm") {
    return `${c.recipient.tag}`;
  }
  return `#${c.name}`;
};

const getFormattedName = c => {
  if (c.type === "dm") {
    return `DM: ${c.recipient.tag} -- ${c.recipient.id}`;
  }
  return `#${c.name} -- ${c.guild.name} -- ${c.id}`;
};

class QChannel {
  constructor({ id }) {
    // Check validity of object
    const c = discord.getChannel(id);
    if (!c) {
      log(`Got an invalid id for QChannel construction: ${id}`);
      this.id = null;
      return;
    }
    this.type = getType(c);
    this.name = getName(c);
    this.formattedName = getFormattedName(c);
    this.id = this.type === "dm" ? c.recipient.id : id;
    this.gid = this.type === "dm" ? c.recipient.id : c.guild.id;
    this.oid = this.type === "dm" ? c.recipient.id : c.guild.ownerID;
  }

  // Returns a discord.js channel object
  async obj() {
    if (this.type === "dm") {
      return discord.getUserDm(this.id);
    }
    return discord.getChannel(this.id);
  }

  // Return a direct channel to the owner of this qChannel
  async ownerObj() {
    if (this.type === "dm") {
      return discord.getUserDm(this.id);
    }
    return discord.getUserDm(this.oid);
  }

  async send(content) {
    const c = await this.obj();
    return c.send(content);
  }

  async sendToOwner(content) {
    const c = await this.ownerObj();
    return c.send(content);
  }

  // Returns a raw Discord guild object
  guild() {
    if (this.type === "dm") {
      return null;
    }
    return discord.getGuild(this.gid);
  }

  static async bestGuildChannel(guild) {
    // Check the system channel
    if (guild.systemChannelID) {
      const sysChan = discord.getChannel(guild.systemChannelID);
      if (sysChan && discord.canPostIn(sysChan)) return new QChannel(sysChan);
    }

    // Check #general
    const genChan = guild.channels.find(
      c => c.type === "text" && c.name === "general"
    );
    if (genChan && discord.canPostIn(genChan)) return new QChannel(genChan);

    // Iterate over all channels and find the first best one
    const firstBest = guild.channels.find(
      c => c.type === "text" && discord.canPostIn(c)
    );
    if (firstBest) return new QChannel(firstBest);
    // Try to reach the owner, this might fail, we'll return null here if all fails
    const dm = await discord.getUserDm(guild.ownerID);
    if (dm) return new QChannel(dm);
    return null;
  }

  // Best channel starting from this channel
  // Can return null
  async bestChannel() {
    const c = await this.obj();
    if (this.type === "dm" || discord.canPostIn(c)) {
      return this;
    }
    // From now on we can't post in this channel
    return QChannel.bestGuildChannel(this.guild());
  }

  serialize() {
    return {
      id: this.id,
      isDM: this.type === "dm"
    };
  }

  static async unserialize({ id, isDM }) {
    if (!isDM) return new QChannel({ id });
    const dm = await discord.getUserDm(id);
    if (dm) return new QChannel(dm);
    return null;
  }
}

module.exports = QChannel;
