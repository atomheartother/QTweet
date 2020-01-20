import * as config from '../config.json';
import log from './log';

// Takes an author and returns whether or not they are an admin
export const isAdmin = (author) => author.id === config.ownerID;

// Takes an author. checks that they're able to perform mod-level commands
export const isMod = async (author, qChannel) => {
  const isSomeOwner = author.id === config.ownerID
    || (!!qChannel && author.id === qChannel.ownerId());
  if (isSomeOwner) { // The user is either the channel owner or us. We can just accept their command
    return true;
  }
  const guild = await qChannel.guild();
  if (!qChannel && !guild) {
    log("User isn't an owner and we can't check for more", qChannel);
    return false;
  }
  return new Promise((resolve) => guild
    .fetchMember(author)
    .then((member) => {
      // Are they an admin or have global management rights? (means they're a moderator)
      let modRole = member.permissions
        .toArray()
        .find(
          (perm) => perm === 'ADMINISTRATOR'
              || perm === 'MANAGE_GUILD'
              || perm === 'MANAGE_CHANNELS',
        );
      log(`User is some mod: ${!!modRole}`, qChannel);
      // Now we can check if they have the appropriate role
      if (!modRole) {
        modRole = member.roles.find((role) => role.name === config.modRole);
        log(
          `User has the custom '${config.modRole}' role: ${!!modRole}`,
          qChannel,
        );
      }
      resolve(!!modRole);
    })
    .catch((err) => {
      log(`Couldn't get info for ${author.username}`, qChannel);
      log(err);
      resolve(false);
    }));
};

export const isDm = (author, qChannel) => qChannel.isDM;

export const isNotDm = (author, qChannel) => !qChannel.isDM;
