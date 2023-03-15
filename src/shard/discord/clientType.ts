import { Client as DiscordClient, Collection, CommandInteraction } from 'discord.js';

// extend client to have slashcommands in it
export class Client extends DiscordClient {
  public slashCommands = new Collection();
}
