const Discord = require('discord.js');
var dClient = new Discord.Client();

var discord = module.exports = {};

discord.onMessage = (callback) => {
    dClient.on('message', callback);
}

discord.onError = (callback) => {
    dClient.on('error', callback);
}

discord.onGuildCreate = (callback) => {
    dClient.on('guildCreate', callback);
}

discord.onGuildDelete = (callback) => {
    dClient.on('guildDelete', callback);
}

discord.onReady = (callback) => {
    dClient.on('ready', callback);
}

discord.login = (token) => {
    return dClient.login(token);
};

discord.user = () => {
    return dClient.user; 
}

discord.getChannel = (id) => {
    return dClient.channels.get(id);
}

discord.getGuild = (id) => {
    return dClient.guilds.get(id)
}