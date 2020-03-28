// A module registering discord events and reacting to them
import { fortune } from 'fortune-teller';

// Config file
import {
  rmChannel, rmGuild, getGuildInfo,
} from '../subs';
import QChannel from './QChannel';

// logging
import log from '../log';
import {
  message as postMessage,
  translated as postTranslatedMessage,
} from './post';
import { createStream, destroyStream } from './master';
import commands from './commands';
import { user, login } from './discord';
import i18n from './i18n';

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
      qChannel,
    );
    const passedArray = await Promise.all(command.checks.map(({ f }) => f(author, qChannel)));
    for (let i = 0; i < command.checks.length; i += 1) {
      const { badB } = command.checks[i];
      if (!passedArray[i]) {
        // If it's not met and we were given a bad boy, post it
        if (badB) postTranslatedMessage(qChannel, badB);
        log(`Rejected command "${commandName} ${args}" with reason: ${badB}`);
        return;
      }
    }
    command.function(args, qChannel, author);
  }
};

export const handleMessage = async (message) => {
  // Ignore bots
  if (message.author.bot) return;
  const { author, channel } = message;
  const qc = new QChannel(channel);
  const { lang, prefix } = await getGuildInfo(await qc.guildId());
  console.log(lang, prefix);
  // In case anything goes wrong with the db prefix, still use the old prefix as backup!
  if (message.content.indexOf(prefix) !== 0) {
    if (
      !!message.mentions
      && !!message.mentions.members
      && message.mentions.members.find((item) => item.user.id === user().id)
    ) {
      message.reply(fortune());
    } else if (message.channel.type === 'dm') {
      postMessage(qc, i18n(lang, 'welcomeMessage'));
    }
    return;
  }
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);

  const command = args.shift().toLowerCase();
  handleCommand(command, author, qc, args);
};

export const handleError = ({ message, error }) => {
  log(`Discord client encountered an error: ${message}`);
  log(error);
  // Destroy the twitter stream cleanly, we will re-intantiate it sooner that way
  destroyStream();
  login();
};

export const handleGuildCreate = async (guild) => {
  // Message the guild owner with useful information
  log(`Joined guild ${guild.name}`);
};

export const handleGuildDelete = async ({ id, name }) => {
  const { users } = await rmGuild(id);
  log(`Left guild ${name}, ${users} users deleted.`);
  if (users > 0) createStream();
};

export const handleReady = async () => {
  log('✅ Logged in to Discord');
  createStream();
};

export const handleChannelDelete = async ({ id, name }) => {
  const { users } = await rmChannel(id);
  log(`Channel #${name} (${id}) deleted.`);
  if (users > 0) createStream();
};
