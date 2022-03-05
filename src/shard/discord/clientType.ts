import { Client as DiscordClient, Collection, CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import QChannel from '../QChannel/QChannel';

// extend client to have slashcommands in it
export class Client extends DiscordClient {
  public slashCommands = new Collection();
}

// make ts happy with command files
export interface SlashCommand {
  data: SlashCommandBuilder;
  function: (params: { client: Client; interaction: CommandInteraction; qc: QChannel }) => any | Promise<any>;
}
