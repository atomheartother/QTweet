import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { Client } from './clientType';

export default (client: Client) => {
  // get commands json data
  const commands = [...client.slashCommands.values()].map((command: any) => command.data.toJSON());

  // register them
  console.log('Registering slash commands...');
  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!);

  // ATTENTION: this is guild commands, which are registered instantly
  // change to .applicationGuildCommands(appId, guildId) to test them or put in a single server
  // change to .applicationCommands(appId) to register them globally
  // they can take up to one hour to register
  rest.put(Routes.applicationGuildCommands(client.application!.id, '928066059620196412'), { body: commands }).then(() => {
    console.log('Registered slash commands successfully!');
  });
};
