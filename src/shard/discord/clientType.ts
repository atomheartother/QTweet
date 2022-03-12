import { Client as DiscordClient, Collection, CommandInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import QChannel from '../QChannel/QChannel';

// extend client to have slashcommands in it
export class Client extends DiscordClient {
  public slashCommands = new Collection();
}

// make ts happy with command files
export interface SlashCommand {
  data: Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder;
  function: (params: { client: Client; interaction: CommandInteraction; qc: QChannel }) => void | Promise<void>;
}
