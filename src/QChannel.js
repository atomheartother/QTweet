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
    this.gid = this.type === "dm" ? c.recipient.id : c.guild.id;
    this.oid = this.type === "dm" ? c.recipient.id : c.guild.ownerID;
  }

  // Returns a discord.js channel object
  async obj() {
    if (this.type === "dm") {
      const usr = discord.getUser(this.id);
      return usr.dmChannel ? usr.dmChannel : usr.createDM();
    }
    return discord.getChannel(this.id);
  }

  // Return a direct channel to the owner of this qChannel
  async ownerObj() {
    if (this.type === "dm") {
      return this.obj();
    }
    const usr = discord.getUser(this.oid);
    return usr.dmChannel ? usr.dmChannel : usr.createDM();
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
