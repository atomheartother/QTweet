// Config file
import fortune from 'fortune-teller';
import {
  rmChannel, rmGuild, getGuildInfo,
} from '../../subs';
import QChannel from '../QChannel/QChannel';
import { CmdOptions, ParsedCmd} from './type'
// logging
import log from '../../log';
import {
  message as postMessage,
  translated as postTranslatedMessage,
} from '../post';
import { createStream, destroyStream } from '../master';
import commands from '../commands';
import { user, login, isNewsChannel, isTextChannel } from './discord';
import i18n from '../i18n';
import dbl from '../dbl';
import { Channel, Guild, Message, User } from 'discord.js';

const handleCommand = async (commandName: string, author: User, qChannel: QChannel, parsedArgs: ParsedCmd) => {
  const command = commands[commandName];
  // Check that the command exists
  if (command) {
    const { args } = parsedArgs;
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
    command.function(parsedArgs, qChannel, author);
  }
};

// Input: str
const parseWords = (line: string): ParsedCmd => {
  const regxp = /--(\w+)(="(.*?)"|=(\S+))?|"(.*?)"|(\S+)/g;
  const args = [];
  const flags = [];
  const options: CmdOptions = {}
  let match = regxp.exec(line);
  while (match) {
    if (match[6] || match[5]) { // Single word or multiple word arg
      args.push(match[6] || match[5]);
    } else if (match[1] && !match[2]) { // Option with no equal
      flags.push(match[1]);
    } else {
      const key = match[1];
      const value = match[3] || match[4]; // Multiple word value or simple value
      options[key] = value;
    }
    match = regxp.exec(line);
  }
  return { args, flags, options };
};

export const handleMessage = async (message: Message) => {
  // Ignore bots
  if (message.author.bot) return;
  const { author, channel } = message;
  if (isNewsChannel(channel)) return;
  const qc = new QChannel(channel);
  const { lang, prefix } = await getGuildInfo(qc.guildId());
  // In case anything goes wrong with the db prefix, still use the old prefix as backup!
  if (message.content.indexOf(prefix) !== 0) {
    if (
      !!message.mentions
      && !!message.mentions.members
      && message.mentions.members.find((item) => item.user.id === user().id)
    ) {
      message.reply(`My prefix on this server is \`${prefix}\`\n\n${fortune.fortune()}`);
    } else if (message.channel.type === 'dm') {
      postMessage(qc, i18n(lang, 'welcomeMessage'));
    }
    return;
  }

  const [command, ...words] = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);

  const parsedCmd = parseWords(words.join(' '));
  handleCommand(command.toLowerCase(), author, qc, parsedCmd);
};

export const handleError = ({ message, error }) => {
  log(`Discord client encountered an error: ${message}`);
  log(error);
  // Destroy the twitter stream cleanly, we will re-intantiate it sooner that way
  destroyStream();
  login();
};

export const handleGuildCreate = async (guild: Guild) => {
  // Message the guild owner with useful information
  log(`Joined guild ${guild.name}`);
};

export const handleGuildDelete = async ({ id, name }: Guild) => {
  const { users } = await rmGuild(id);
  log(`Left guild ${name}, ${users} users deleted.`);
  if (users > 0) createStream();
};

export const handleReady = async () => {
  log('✅ Logged in to Discord');
  // If we're using DBL, init it here
  dbl();
  createStream();
};

export const handleChannelDelete = async (c: Channel) => {
  if (!isTextChannel(c)) return;
  const {id, name} = c;
  const { users } = await rmChannel(id);
  log(`Channel #${name} (${id}) deleted.`);
  if (users > 0) createStream();
};
