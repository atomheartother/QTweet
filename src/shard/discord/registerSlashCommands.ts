import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { Client } from './clientType';
import log from '../../log';

export default (client: Client) => {
  // get commands json data
  const commands = [...client.slashCommands.values()].map((command: any) => command.data.toJSON());

  // register them
  log('⚙️  Registering slash commands...');
  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  const slashCmdsGuild = process.env.SLASH_CMDS_GUILD
  if (slashCmdsGuild) {
      log(`⚠️ DEV MODE \nRegistering slash commands in guild ${slashCmdsGuild}!`);
    rest.put(Routes.applicationGuildCommands(client.application!.id, slashCmdsGuild), { body: commands }).then(() => {
      log('✅ Registered guild slash commands');
    });
  } else {
    rest.put(Routes.applicationCommands(client.application!.id), { body: commands }).then(() => {
      log('✅ Registered slash commands');
    });

  }
};
