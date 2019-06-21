// Direct mappings for discord.js methods
import Discord from "discord.js";
// Passwords file
import * as pw from "../pw.json";

let dClient = new Discord.Client();

export const getClient = () => {
  return dClient;
};

export const login = () => {
  return dClient.login(pw.dToken);
};

export const user = () => {
  return dClient.user;
};

export const getChannel = id => {
  return dClient.channels.get(id);
};

export const getGuild = id => {
  return dClient.guilds.get(id);
};

export const getUser = id => {
  return dClient.users.get(id);
};

export const getUserDm = async id => {
  const usr = dClient.users.get(id);
  if (!usr) return null;
  return usr.dmChannel ? usr.dmChannel : usr.createDM();
};

export const canPostIn = channel => {
  if (!channel) return false;
  const permissions = channel.permissionsFor(dClient.user);
  return (
    permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
    permissions.has(Discord.Permissions.FLAGS.VIEW_CHANNEL)
  );
};
