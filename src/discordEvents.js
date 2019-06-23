import usage from "./usage";
import Discord from "discord.js";

// A module registering discord events and reacting to them
import { fortune } from "fortune-teller";

// Config file
import * as config from "../config.json";
import * as subs from "./subs";
import QChannel from "./QChannel";

// logging
import log from "./log";
import { message as postMessage, dm, embed as postEmbed } from "./post";
import { createStream, destroyStream } from "./twitter";
import commands from "./commands";
import { user, getClient } from "./discord";

const handleCommand = (commandName, author, qChannel, args) => {
  const command = commands[commandName];
  // Check that the command exists
  if (command) {
    // Check that there's the right number of args
    if (args.length < command.minArgs) {
      postMessage(qChannel, usage[commandName]);
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
            if (badB) postMessage(qChannel, badB); // If it's not met and we were given a bad boy, post it
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

export const handleMessage = message => {
  // Ignore bots
  if (message.author.bot) return;

  if (message.content.indexOf(config.prefix) !== 0) {
    if (
      !!message.mentions &&
      !!message.mentions.members &&
      message.mentions.members.find(item => item.user.id === user().id)
    ) {
      message.reply(fortune());
    } else if (message.channel.type == "dm")
      postMessage(
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
      .setTitle(`${config.botName} is here to help!`)
      .setURL(config.profileURL)
      .setDescription(
        `Hello, I'm ${
          config.botName
        }, I'm a very simple bot who cross-posts twitter posts to Discord!\n**You should read my [complete documentation](${
          config.docsURL
        })**.\n\n**Want to invite me to your server?** [Click here](${
          config.inviteLink
        }) !\n**Problems, questions?** [We have a support server!](${
          config.supportServ
        })\nHere's a short list of commands to get you started:`
      )
      .addField(`${config.prefix}tweet`, usage["tweet"])
      .addField(`${config.prefix}start`, usage["start"])
      .addField(`${config.prefix}stop`, usage["stop"])
      .addField(`${config.prefix}list`, usage["list"]);
    postEmbed(message.channel, { embed });
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
    return;
  }
  handleCommand(command, author, qc, args);
};

export const handleError = ({ message, error }) => {
  log(`Discord client encountered an error: ${message}`);
  log(error);
  // Destroy the twitter stream cleanly, we will re-intantiate it sooner that way
  destroyStream();
  getClient().login();
};

export const handleGuildCreate = async guild => {
  // Message the guild owner with useful information
  log(`Joined guild ${guild.name}`);
  const qc = await QChannel.unserialize({ id: guild.ownerID, isDM: true });
  if (qc && qc.id)
    dm(
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

export const handleGuildDelete = ({ id, name }) => {
  log(`Left guild ${name}`);
  subs.rmGuild(id);
};

export const handleReady = () => {
  log("Successfully logged in to Discord");
  // If our name changed, set it
  if (user().username !== config.botName) {
    user().setUsername(config.botName);
  }
  subs.load(() => {
    // All users have been registered, we can request the stream from Twitter
    createStream();
    // ... And save any changes we made
    subs.save();
  });
};
