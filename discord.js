// Direct mappings for discord.js methods
const Discord = require("discord.js");

// Passwords file
const pw = require("./pw.json");

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
    console.log(`Getting channel object for id ${id}`);
    return dClient.channels.get(id);
  },

  getGuild: id => {
    console.log(`Getting guild object for id ${id}`);
    return dClient.guilds.get(id);
  },

  canPostIn: channel => {
    console.log(`Checking if we can post in channel ${channel.name}`);
    const permissions = channel.permissionsFor(dClient.user);
    return (
      permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
      permissions.has(Discord.Permissions.FLAGS.VIEW_CHANNEL)
    );
  }
};
