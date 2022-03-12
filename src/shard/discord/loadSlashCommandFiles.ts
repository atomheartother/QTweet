import fs from 'fs';
import { Client } from './clientType';
import log from '../../log';

export default (client: Client) => {
  log('Loading command files...');

  // read commands dir and filter .ts files
  const commandFiles = fs.readdirSync('../slashCommands', { withFileTypes: true }).filter((file) => file.name.endsWith('.ts'));

  console.log('Loaded command files successfully!');
  console.log('Importing command files...');

  // require the files and insert them into the collection
  for (const commandFile of commandFiles) {
    let command = require('./slashCommands/' + commandFile.name);
    if (command.default) command = command.default;
    client.slashCommands.set(command.data.name, command);
  }

  console.log('Command files ready!');
};
