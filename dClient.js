const Discord = require('discord.js');
const pw = require('./pw.json');

var dClient = new Discord.Client();

dClient.login(pw.dToken);

module.exports = dClient;
