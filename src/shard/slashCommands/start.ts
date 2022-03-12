import { compute as computeFlags } from '../../flags';
import { SlashCommand } from '../discord/clientType';
import { SlashCommandBuilder } from '@discordjs/builders';
import { cmd } from '../master';
import { getScreenName } from '../commands/helpers';
import { isChannelMod } from '../commands/checks';
import { translated } from '../post';
import log from '../../log';

type Flag = {
  name: string
  description: string
}

const flagDefinitions : Flag[] = [
	{name: "notext", description: "Don't post text-only tweets, only post media tweets."},
	{name: "retweets", description: "Post retweets from this/these account(s)."},
	{name: "noreplies", description: "Don't post replies from this user to other users."},
]

const initSlashCommandBuilder = () => {
  const b = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Subscribe to a twitter user and post their tweets in real time.')
    .addStringOption((option) => option.setName('users').setDescription('The @ of the user/users to follow, separated by spaces.').setRequired(true))
    .addStringOption((option) => option.setName('msg').setDescription('The message to send along with the tweet.').setRequired(false))
  flagDefinitions.forEach(({name, description}) => {
    b.addBooleanOption((option) => option.setName(name).setDescription(description).setRequired(false));
  })
  return b;
}

const Start : SlashCommand = {
  data: initSlashCommandBuilder(),
  function: async ({ interaction, qc }) => {
    const isMod = await isChannelMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'startForMods');
      log('Rejected command "start" with reason: startForMods');
      return;
    }

    const flagsArr : string[] = flagDefinitions.reduce((acc, curr) => {
      const opt = interaction.options.getBoolean(curr.name, false);
      if (opt) {
        return [...acc, curr.name]
      }
      return acc;
    }, [])
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
