// A module registering discord events and reacting to them
import { fortune } from "fortune-teller";

// Config file
import * as config from "../config.json";
import { rmChannel, rmGuild, sanityCheck, getLang } from "./subs";
import QChannel from "./QChannel";

// logging
import log from "./log";
import {
  message as postMessage,
  dm,
  translated as postTranslatedMessage
} from "./post";
import { createStream, destroyStream } from "./twitter";
import commands from "./commands";
import { user, login } from "./discord";
import i18n from "./i18n";

const handleCommand = async (commandName, author, qChannel, args) => {
  const command = commands[commandName];
  // Check that the command exists
  if (command) {
    // Check that there's the right number of args
    if (args.length < command.minArgs) {
      postTranslatedMessage(qChannel, `usage-${commandName}`);
      return;
    }
    log(
      `Executing command: "${commandName} ${args}" from ${author.tag}`,
      qChannel
    );
    for (let i = 0; i < command.checks.length; i++) {
      const { f, badB } = command.checks[i];
      const passed = await f(author, qChannel);
      if (!passed) {
        if (badB) postTranslatedMessage(qChannel, badB); // If it's not met and we were given a bad boy, post it
        log(`Rejected command "${commandName} ${args}" with reason: ${badB}`);
        return;
      }
    }
    command.function(args, qChannel, author);
  }
};

export const handleMessage = async message => {
  // Ignore bots
  if (message.author.bot) return;
  const { author, channel } = message;

  if (message.content.indexOf(config.prefix) !== 0) {
    if (
      !!message.mentions &&
      !!message.mentions.members &&
      message.mentions.members.find(item => item.user.id === user().id)
    ) {
      message.reply(fortune());
    } else if (message.channel.type == "dm") {
      const qc = new QChannel(channel);
      const lang = await getLang(qc.guildId());
      postMessage(qc, i18n(lang, "welcomeMessage"));
    }
    return;
  }
  let args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);

  let command = args.shift().toLowerCase();
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
  if (qc && qc.id) dm(qc, i18n("en", "welcomeMessage"));
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
