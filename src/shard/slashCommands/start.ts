import { compute as computeFlags } from '../../flags';
import { SlashCommand } from '../discord/clientType';
import { SlashCommandBuilder } from '@discordjs/builders';
import { cmd } from '../master';
import { getScreenName } from '../commands/helpers';
import { isChannelMod } from '../commands/checks';
import { translated } from '../post';
import log from '../../log';

const Start : SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Subscribe to a twitter user and post their tweets in real time.')
    .addStringOption((option) => option.setName('users').setDescription('The @ of the user/users to follow, separated by space.').setRequired(true))
    .addStringOption((option) => option.setName('flags').setDescription('The flags to use, separated by space. Check docs for more info').setRequired(false))
    .addStringOption((option) => option.setName('msg').setDescription('The message to send along with the tweet.').setRequired(false)),
  function: async ({ interaction, qc }) => {
    const isMod = await isChannelMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'startForMods');
      log('Rejected command "start" with reason: startForMods');
      return;
    }
    const flagsArr = interaction.options.getString('flags', true).split(' ');
    const flags = computeFlags(flagsArr);

    const screenNamesArr = interaction.options.getString('users', true).split(' ');
    const screenNames = screenNamesArr.map(getScreenName);

    const [ownerId, guildId] = await Promise.all([qc.ownerId(), qc.guild()]);

    cmd('start', {
      screenNames,
      flags,
      qc: { ...qc.serialize(), ownerId, guildId },
      msg: interaction.options.getString('msg'),
    });
  },
};

export default Start;
