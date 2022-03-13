// Config file
import fortune from 'fortune-teller';
import QChannel, { isQCSupportedChannel } from '../QChannel/QChannel';
import { CmdOptions, ParsedCmd} from '.'
// logging
import log from '../../log';
import {
  message as postMessage,
} from '../post';
import { createStream, destroyStream } from '../master';
import { user, login, isTextChannel, isDmChannel, getClient } from './discord';
import i18n from '../i18n';
import dbl from '../dbl';
import { AnyChannel, Guild, Message } from 'discord.js';
import handleCommand from '../commands';
import { rmGuild, getGuildInfo } from '../../db/guilds';
import { rmChannel } from '../../db/channels';
import loadSlashCommandFiles from './loadSlashCommandFiles';
import registerSlashCommands from './registerSlashCommands';

const parseWords = (line: string): ParsedCmd => {
  const regxp = /(?:--|—)(\w+)(=(?:"|”|“)(.*?)(?:"|”|“)|=(\S+))?|(?:"|”|“)(.*?)(?:"|”|“)|(\S+)/g;
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
  if (!isQCSupportedChannel(channel)) return;
  const qc = new QChannel(channel);
  const { lang, prefix } = await getGuildInfo(qc.guildId());
  // In case anything goes wrong with the db prefix, still use the old prefix as backup!
  if (message.content.indexOf(prefix) !== 0) {
    if (
      !!message.mentions
      && !!message.mentions.members
      && message.mentions.members.find((item) => item.user.id === user().id)
    ) {
      message.reply(`${i18n(lang, 'pingReply', {prefix})}\n\n${fortune.fortune()}`);
    } else if (isDmChannel(message.channel)) {
      postMessage(qc, i18n(lang, 'welcomeMessage'));
    }
    return;
  }

  const [command, ...words] = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);

  const parsedCmd = parseWords(words.join(" "));
  handleCommand(command.toLowerCase(), author, qc, parsedCmd);
};

export const handleInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;
  const client = getClient();

  // defer the reply so that 'the application did not responded' is avoided,
  // and also because it counts as a reply
  await interaction.deferReply();

  // get command from the loaded slash commands
  const command = client.slashCommands.get(interaction.commandName) as any;

  // if not found
  if (!command) interaction.reply("This slash command couldn't be found");

  if (!isQCSupportedChannel(interaction.channel)) return;

  const qc = new QChannel(interaction.channel);

  // run the command
  await command.function({ client, interaction, qc });

  // delete the command reply (the defer)
  await interaction.deleteReply();
};

export const handleError = ({ message }: Error) => {
  log(`Discord client encountered an error: ${message}`);
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
  loadSlashCommandFiles(getClient());
  registerSlashCommands(getClient());
};

export const handleChannelDelete = async (c: AnyChannel) => {
  if (!isTextChannel(c)) return;
  const {id, name} = c;
  const { users } = await rmChannel(id);
  log(`Channel #${name} (${id}) deleted.`);
  if (users > 0) createStream();
};
