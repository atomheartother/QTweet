// Direct mappings for discord.js methods
const Discord = require("discord.js");

// Passwords file
import * as pw from "../pw.json";

let dClient = new Discord.Client();

module.exports = {
  getClient: () => {
    return dClient;
  },
  login: () => {
    return dClient.login(pw.dToken);
  },
  user: () => {
    return dClient.user;
  },

  getChannel: id => {
    return dClient.channels.get(id);
  },

  getGuild: id => {
    return dClient.guilds.get(id);
  },

  getUser: id => {
    return dClient.users.get(id);
  },

  getUserDm: async id => {
    const usr = dClient.users.get(id);
    if (!usr) return null;
    return usr.dmChannel ? usr.dmChannel : usr.createDM();
  },

  canPostIn: channel => {
    if (!channel) return false;
    const permissions = channel.permissionsFor(dClient.user);
    return (
      permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
      permissions.has(Discord.Permissions.FLAGS.VIEW_CHANNEL)
    );
  }
};
