// Helper class to interact with channels and keep memory down
const discord = require("./discord");
const log = require("./log");

// Some selectors
const getType = c => c.type;
const getName = c => {
  if (c.type === "dm") {
    return `${c.recipient.username}#${c.recipient.discriminator}`;
  }
  return `#${c.name}`;
};

const getFormattedName = c => {
  if (c.type === "dm") {
    return `DMs of ${c.recipient.username}#${c.recipient.discriminator}`;
  }
  return `#${c.name} -- ${c.guild.name}`;
};

class QChannel {
  constructor({ id }) {
    // Check validity of object
    const c = discord.getChannel(id);
    if (!c) {
      log(`Got an invalid id for QChannel construction: ${id}`);
      return null;
    }
    this.id = id;
    this.type = getType(c);
    this.name = getName(c);
    this.formattedName = getFormattedName(c);
  }

  // Returns a discord.js channel object
  obj() {
    return discord.getChannel(this.id);
  }

  send(content) {
    return this.obj().send(content);
  }

  guildId() {
    if (this.type === "dm") {
      return null;
    }
    return this.obj().guild.id;
  }

  // Returns a raw Discord guild object
  guild() {
    if (this.type === "dm") {
      return null;
    }
    return discord.getGuild(this.guildId());
  }

  ownerId() {
    if (this.type === "dm") {
      return this.obj().recipient.id;
    }
    return this.obj().guild.ownerId;
  }

  // Return a qChannel for the owner of this qChannel
  owner() {
    if (this.type === "dm") {
      return this;
    }
    const usr = discord.getUser(this.ownerId());
    if (!usr.dmChannel) {
      log("Could not find owner for qChannel", this);
      return null;
    }
    return QChannel(usr.dmChannel);
  }

  firstPostableChannel() {
    if (this.type !== "text") return this;
    if (discord.canPostIn(this.obj())) {
      return this;
    }
    const firstBest = this.obj()
      .guild.channels.filter(c => c.type === "text")
      .find(c => discord.canPostIn(c));
    if (!firstBest) return null;
    return new QChannel(firstBest);
  }
}

module.exports = QChannel;
