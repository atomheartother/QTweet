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
    return `DM: ${c.recipient.tag}`;
  }
  return `#${c.name} -- ${c.guild.name}`;
};

class QChannel {
  constructor({ id, type }) {
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
  }

  // Returns a discord.js channel object
  async obj() {
    if (this.type === "dm") {
      const u = discord.getUser(this.id);
      if (u.dmChannel) return u.dmChannel;
      const dmChannel = await u.createDM();
      return dmChannel;
    }
    return discord.getChannel(this.id);
  }

  async send(content) {
    const c = await this.obj();
    return c.send(content);
  }

  async sendToOwner(content) {
    const c = await this.owner();
    return c.send(content);
  }

  async guildId() {
    if (this.type === "dm") {
      return this.ownerId();
    }
    const c = await this.obj();
    return c.guild.id;
  }

  // Returns a raw Discord guild object
  async guild() {
    if (this.type === "dm") {
      return null;
    }
    const id = await this.guildId();
    return discord.getGuild(id);
  }

  async ownerId() {
    const c = await this.obj();
    if (this.type === "dm") {
      return c.recipient.id;
    }
    return c.guild.ownerID;
  }

  // Return a qChannel for the owner of this qChannel
  async owner() {
    if (this.type === "dm") {
      return this;
    }
    const id = await this.ownerId();
    const usr = discord.getUser(id);
    if (usr.dmChannel) return new QChannel(usr.dmChannel);
    const dm = await usr.createDM();
    return new QChannel(dm);
  }

  async firstPostableChannel() {
    if (this.type !== "text") return this;
    const c = await this.obj();
    if (discord.canPostIn(c)) {
      return this;
    }
    const firstBest = c.guild.channels
      .filter(c => c.type === "text")
      .find(c => discord.canPostIn(c));
    if (!firstBest) return null;
    return new QChannel(firstBest);
  }

  serialize() {
    return {
      id: this.id,
      isDM: this.type === "dm"
    };
  }

  static async unserialize({ id, isDM }) {
    if (!isDM) return new QChannel({ id });
    const u = discord.getUser(id);
    if (u.dmChannel) return new QChannel({ id: u.dmChannel.id });
    const dmChannel = await u.createDM();
    return new QChannel({ id: dmChannel.id });
  }
}

module.exports = QChannel;
