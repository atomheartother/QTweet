import log from '../../log';
import { getChannelSubs } from '../../db/subs';
import { translated } from '../post';
import QChannel, { isQCSupportedChannel } from '../QChannel/QChannel';
import { rmChannel } from '../../db/channels';
import { SlashCommand } from '../discord/clientType';
import { SlashCommandBuilder } from '@discordjs/builders';
import { isChannelMod } from '../commands/checks';

const StopChannel : SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('stopchannel')
    .setDescription('Acts like /stop but on the whole channel.')
    .addStringOption((option) => option.setName('channelid').setDescription('The channel ID to stop posts').setRequired(false)),

  function: async ({ qc, interaction }) => {
    const isMod = await isChannelMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'stopForMods');
      log('Rejected command "stop" with reason: stopForMods');
      return;
    }
    let targetChannel = qc.id;
    let channelName = await qc.name();
    const args = interaction.options.getString('channelId').split(' ');

    if (args.length > 0) {
      if (qc.isDM) {
        translated(qc, 'stopChannelInDm');
        return;
      }
      const guild = await qc.guild();
      [targetChannel] = args;
      const channelObj = guild.channels.cache.find((c) => c.id === targetChannel);
      if (!channelObj || !isQCSupportedChannel(channelObj)) {
        translated(qc, 'noSuchChannel', { targetChannel });
        return;
      }
      channelName = await new QChannel(channelObj).name();
    }
    const subs = await getChannelSubs(targetChannel);
    await rmChannel(targetChannel);
    log(`Removed all gets from channel ID:${targetChannel}. ${subs.length} subs removed.`, qc);
    translated(qc, 'stopChannelSuccess', { subs: subs.length, channelName });
  },
}

export default StopChannel;
