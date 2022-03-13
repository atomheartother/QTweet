import { SlashCommandBuilder } from '@discordjs/builders';
import { cmd } from '../master';
import { isOwner } from '../commands/checks';
import { translated } from '../post';
import log from '../../log';
import {SlashCommand} from './types';

const Announce: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Posts an announcement to every guild this bot is currently posting in.')
    .addStringOption((option) => option.setName('msg').setDescription('The message to announce').setRequired(true)),

  function: async ({ interaction, qc }) => {
    const owner = await isOwner(interaction.user, qc);
    if (!owner) {
      translated(qc, 'announceForAdmin');
      log(`Rejected command "announce" with reason: announceForAdmin`);
      return;
    }
    const msg = interaction.options.getString('msg', true).replaceAll("\\n", "\n");
    cmd('announce', { msg });
  },
}

export default Announce;
