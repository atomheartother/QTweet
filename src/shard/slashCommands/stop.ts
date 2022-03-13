import { cmd } from '../master';
import { translated } from '../post';
import { getScreenName } from '../commands/helpers';
import { SlashCommandBuilder } from '@discordjs/builders';
import { isChannelMod } from '../commands/checks';
import log from '../../log';
import {SlashCommand} from './types';

const Stop: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Causes QTweet to stop sending you tweets from this particular user.')
    .addStringOption((option) => option.setName('users').setDescription('The users to stop getting tweets from, separated by space.').setRequired(true)),

  function: async ({ interaction, qc }) => {
    const isMod = await isChannelMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'stopForMods');
      log('Rejected command "stop" with reason: stopForMods');
      return;
    }
    const screenNames = interaction.options.getString('users').split(' ').map(getScreenName);
    if (screenNames.length < 1) {
      translated(qc, 'usage-stop');
      return;
    }
    cmd('stop', { screenNames, qc: qc.serialize() });
  },
}

export default Stop;
