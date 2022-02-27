import { CheckFn } from '.';
import { isDmChannel } from '../discord/discord';
import log from '../../log';
import process from 'process'

const envOwnerId = process.env.OWNER_ID;
const envModRole = process.env.MOD_ROLE;

// Takes an author and returns whether or not they are the owner of the bot
export const isOwner: CheckFn = (author) => author.id === envOwnerId;

// Whether or not the author is a server admin (with server-wide powers) or the bot owner
export const isServerMod: CheckFn = async (author, qChannel) => {
  const serverOwner = isOwner(author, qChannel) || (!!qChannel && author.id === qChannel.ownerId());
  if (serverOwner) return true;
  const guild = await qChannel.guild();
  if (!qChannel && !guild) {
    log("User isn't an owner and we can't check for more", qChannel);
    return false;
  }
  const guildMember = guild.members.resolve(author);
  // Are they an admin or have global management rights? (means they're a moderator)
  const serverWideMod = guildMember.permissions
    .toArray()
    .find(
      (perm) => perm === 'ADMINISTRATOR'
              || perm === 'MANAGE_GUILD'
              || perm === 'MANAGE_CHANNELS',
    );
  if (serverWideMod) return true;
  // Now we can check if they have the appropriate role
  const modRole = guildMember.roles.cache.find((role) => role.name === envModRole);
  return !!modRole;
};

// Takes an author. checks that they have powers on this specific channel
export const isChannelMod: CheckFn = async (author, qChannel) => {
  if (await isServerMod(author, qChannel)) return true;
  const [guild, channel] = await Promise.all([qChannel.guild(), qChannel.obj()]);
  if (isDmChannel(channel)) {
    // This should never be reached.
    return true;
  }
  const guildMember = guild.members.resolve(author);
  const channelPermissions = channel.permissionsFor(guildMember);
  return !!channelPermissions.toArray().find((perm) => perm === 'MANAGE_CHANNELS' || perm === 'MANAGE_MESSAGES');
};

export const isDm: CheckFn = (author, qChannel) => qChannel.isDM;

export const isNotDm: CheckFn = (author, qChannel) => !qChannel.isDM;
