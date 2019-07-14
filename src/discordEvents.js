import usage from "./usage";
import Discord from "discord.js";

// A module registering discord events and reacting to them
import { fortune } from "fortune-teller";

// Config file
import * as config from "../config.json";
import { rmChannel, rmGuild, sanityCheck } from "./subs";
import QChannel from "./QChannel";

// logging
import log from "./log";
import {
  message as postMessage,
  dm,
  embed as postEmbed,
  translated as postTranslatedMessage
} from "./post";
import { createStream, destroyStream } from "./twitter";
import commands from "./commands";
import { user, login } from "./discord";
import i18n from "./i18n";

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
            if (badB) postTranslatedMessage(qChannel, badB); // If it's not met and we were given a bad boy, post it
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
      .setColor(0x0e7675)
      .setTitle(`${config.botName} is here to help!`)
      .setURL(config.profileURL)
      .setDescription(
        i18n("en", "helpIntro", {
          botName: config.botName,
          docsURL: config.docsURL,
          inviteLink: config.inviteLink,
          supportServ: config.supportServ
        })
      )
      .addField(`${config.prefix}tweet`, i18n("en", "usage-tweet"))
      .addField(`${config.prefix}start`, i18n("en", "usage-start"))
      .addField(`${config.prefix}stop`, i18n("en", "usage-stop"))
      .addField(`${config.prefix}list`, i18n("en", "usage-list"))
      .setFooter(`Profile picture art by ryusukehamamoto`);
    postEmbed(message.channel, { embed });
    return;
  }

  const { author, channel } = message;
  const qc = new QChannel(channel);
  handleCommand(command, author, qc, args);
};

export const handleError = ({ message, error }) => {
  log(`Discord client encountered an error: ${message}`);
  log(error);
  // Destroy the twitter stream cleanly, we will re-intantiate it sooner that way
  destroyStream();
  login();
};

export const handleGuildCreate = async guild => {
  // Message the guild owner with useful information
  log(`Joined guild ${guild.name}`);
  const qc = QChannel.unserialize({ channelId: guild.ownerID, isDM: true });
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

export const handleGuildDelete = async ({ id, name }) => {
  log(`Left guild ${name}`);
  const { users } = await rmGuild(id);
  if (users > 0) createStream();
};

export const handleReady = async () => {
  log("Successfully logged in to Discord");
  await sanityCheck();
  createStream();
};

export const handleChannelDelete = async ({ id, name }) => {
  const { subs, users } = await rmChannel(id);
  if (subs > 0) {
    log(`Channel #${name} (${id}) deleted. Removed ${subs} subscriptions.`);
    if (users > 0) createStream();
  }
};
