import { setPrefix } from '../../db/guilds';
import { translated } from '../post';
import { SlashCommand } from '../discord/clientType';
import { SlashCommandBuilder } from '@discordjs/builders';
import { isServerMod } from '../commands/checks';
import log from '../../log';

const QtPrefix : SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('qtprefix')
    .setDescription('Changes the bot prefix for this server')
    .addStringOption((option) => option.setName('prefix').setDescription('The new prefix').setRequired(true)),

  function: async ({ qc, interaction }) => {
    const isMod = await isServerMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'prefixForMods');
      log('Rejected command "qtprefix" with reason: prefixForMods');
      return;
    }
    const prefix = interaction.options.getString('prefix', true);
    setPrefix(qc.guildId(), prefix);
    translated(qc, 'prefixSuccess', { prefix });
  },
}

export default QtPrefix;
