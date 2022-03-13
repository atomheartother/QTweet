import { compute as computeFlags } from '../../flags';
import { cmd } from '../master';
import { getScreenName } from '../commands/helpers';
import { isChannelMod } from '../commands/checks';
import { translated } from '../post';
import log from '../../log';
import {SlashCommand, SlashCommandDefinition} from './types';
import {createSlashCommand} from './utils';

const cmdDef : SlashCommandDefinition = {
  name: "start",
  description: 'Subscribe to a twitter user and post their tweets in real time.',
  options: [
    {name: "users", description: "The @ of the user(s) to follow, separated by spaces.", type: "string", required: true},
    {name: "message", description: "The message to send along each new tweet.", type: "string"},
	{name: "notext", description: "Don't post text-only tweets, only post media tweets."},
	{name: "retweets", description: "Post retweets from this/these account(s)."},
	{name: "noreplies", description: "Don't post replies from this user to other users."},
  ]
}

const Start : SlashCommand = {
  data: createSlashCommand(cmdDef),
  function: async ({ interaction, qc }) => {
    const isMod = await isChannelMod(interaction.user, qc);
    if (!isMod) {
      translated(qc, 'startForMods');
      log('Rejected command "start" with reason: startForMods');
      return;
    }

    const flagsArr : string[] = cmdDef.options.reduce((acc, curr) => {
      if (curr.type !== 'boolean') return acc;
      const opt = interaction.options.getBoolean(curr.name, false);
      if (opt) {
        return [...acc, curr.name]
      }
      return acc;
    }, [])
    const flags = computeFlags(flagsArr);

    const screenNamesArr = interaction.options.getString('users', true).split(' ');
    const screenNames = screenNamesArr.map(getScreenName);

    const [ownerId, guildId] = await Promise.all([qc.ownerId(), qc.guildId()]);

    cmd('start', {
      screenNames,
      flags,
      qc: { ...qc.serialize(), ownerId, guildId },
      msg: interaction.options.getString('msg'),
    });
  },
};

export default Start;
