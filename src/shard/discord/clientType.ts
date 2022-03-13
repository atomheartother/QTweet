import { Client as DiscordClient, Collection, CommandInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import QChannel from '../QChannel/QChannel';

// extend client to have slashcommands in it
export class Client extends DiscordClient {
  public slashCommands = new Collection();
}
