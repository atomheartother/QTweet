// A module registering discord events and reacting to them
const Discord = require("discord.js");
var fortune = require("fortune-teller");

// Config file
const config = require("../config.json");
// Usage strings
const usage = require("./usage.js");
// logging
const log = require("./log");

const gets = require("./gets");
const post = require("./post");
const twitter = require("./twitter");
const users = require("./users");
const commands = require("./commands");
const discord = require("./discord");
const QChannel = require("./QChannel");

const handleCommand = (commandName, author, qChannel, args) => {
  const command = commands[commandName];
  // Check that the command exists
  if (command) {
    // Check that there's the right number of args
    if (args.length < command.minArgs) {
      post.message(qChannel, usage[commandName]);
      return;
    }
    log(
      `Executing command: "${commandName} ${args}" from ${author.tag}`,
      qChannel
    );
    let validChecks = 0;
    let isValid = true;
    if (command.checks.length > 0)
      command.checks.forEach(({ f, badB }) => {
        // Check every condition to perform the command
        f(author, qChannel, passed => {
          // It's already marked as invalid
          if (!isValid) return;
          if (passed) validChecks++;
          else {
            isValid = false;
            if (badB) post.message(qChannel, badB); // If it's not met and we were given a bad boy, post it
            log(
              `Rejected command "${commandName} ${args}" with reason: ${badB}`
            );
            return;
          }
          if (validChecks === command.checks.length) {
            // If we get here, everything has succeeded.
            command.function(args, qChannel, author);
          }
        });
      });
    else command.function(args, qChannel, author);
  }
};

handleMessage = message => {
  // Ignore bots
  if (message.author.bot) return;

  if (message.content.indexOf(config.prefix) !== 0) {
    if (
      !!message.mentions &&
      !!message.mentions.members &&
      message.mentions.members.find(item => item.user.id === discord.user().id)
    ) {
      message.reply(fortune.fortune());
    } else if (message.channel.type == "dm")
      post.message(
        message.channel,
        "Hello, I'm " +
          config.botName +
          "! Type " +
          config.prefix +
          "help to see a list of my commands! ❤"
      );
    return;
  }
  let args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);
  let command = args.shift().toLowerCase();

  if (command === "help" || command === "?") {
    const embed = new Discord.RichEmbed()
      .setColor(0xd667cf)
      .setTitle(config.botName)
      .setURL(config.profileURL)
      .setDescription(
        `Hello, I'm ${
          config.botName
        }, I'm a very simple bot who cross-posts twitter posts to Discord channels!\n**Want to invite me to your server?** [Click here](${
          config.inviteLink
        }) !\n**Need help, found a bug, have a feature idea?** Join our [support server](${
          config.supportServ
        }) !\nHere's a basic list of commands, you can find my complete documentation [here](${
          config.docsURL
        }).`
      )
      .setFooter("*: Anyone can perform these commands.")
      .addField(`${config.prefix}tweet*`, usage["tweet"])
      .addField(`${config.prefix}start`, usage["start"])
      .addField(`${config.prefix}stop`, usage["stop"])
      .addField(`${config.prefix}list*`, usage["list"])
      .addField(`${config.prefix}help*`, "Print this help message.");
    post.embed(message.channel, { embed }, false);
    return;
  }

  const { author, channel } = message;
  const qc = new QChannel(channel);
  if (!qc || !qc.id) {
    channel.send(
      "**Something really weird just happened**\nWow, it appears I don't support whatever you're using to message me... My creator has been notified"
    );
    log("Couldn't create QChannel from channel");
    log(`ChanID: ${channel.id}`);
    log(`OwnrID: ${channel.guild.ownerID}`);
    log(author);
    log(channel.guild);
    log(channel);
  }
  handleCommand(command, author, qc, args);
};

handleError = error => {
  log("Discord client encountered an error");
  console.error(error);
};

handleGuildCreate = async guild => {
  // Message the guild owner with useful information
  log(`Joined guild ${guild.name}`);
  const qc = await QChannel.unserialize({ id: guild.ownerID, isDM: true });
  if (qc && qc.id)
    post.dm(
      qc,
      `Hello, I'm ${
        config.botName
      }, thanks for inviting me to your server!\n**To get started:** \`${
        config.prefix
      }help\` for commands and useful links!\n**If I'm useful to your server**, please consider upvoting me at ${
        config.profileURL
      }\n\nBy using any of my commands, you agree that **any content posted to your server through me is your own responsibility**, check out my documentation for more information.`
    );
  else {
    log(`Could not send welcome message for ${guild.name}`);
  }
};

handleGuildDelete = ({ id, name }) => {
  log(`Left guild ${name}`);
  gets.rmGuild(id);
};

handleReady = () => {
  log("Successfully logged in to Discord");
  // If our name changed, set it
  if (discord.user().username !== config.botName) {
    discord.user().setUsername(config.botName);
  }
  users.load(() => {
    // All users have been registered, we can request the stream from Twitter
    twitter.createStream();
    // ... And save any changes we made
    users.save();
  });
};

handleRateLimit = ({ limit, timeDifference, path, method }) => {
  // log(`Discord is rate-limiting us at ${method} ${path}. ${limit} requests max`);
};

module.exports = {
  registerCallbacks: () => {
    discord
      .getClient()
      .on("rateLimit", handleRateLimit)
      .on("message", handleMessage)
      .on("error", handleError)
      .on("guildCreate", handleGuildCreate)
      .on("guildDelete", handleGuildDelete)
      .on("ready", handleReady);
  }
};
