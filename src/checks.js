import * as config from "../config.json";
import log from "./log";

// Takes an author and returns whether or not they are an admin
export const isAdmin = author => {
  return author.id === config.ownerID;
};

// Takes an author. checks that they're able to perform mod-level commands
export const isMod = async (author, qChannel) => {
  const guild = await qChannel.guild();
  const isSomeOwner =
    author.id === config.ownerID ||
    (!!qChannel && author.id === qChannel.ownerId());
  if (isSomeOwner)
    // The user is either the channel owner or us. We can just accept their command
    return true;
  if (!qChannel && !guild) {
    return false;
  }
  return new Promise(resolve =>
    guild
      .fetchMember(author)
      .then(member => {
        // Are they an admin or have global management rights? (means they're a moderator)
        let modRole = member.permissions
          .toArray()
          .find(
            perm =>
              perm === "ADMINISTRATOR" ||
              perm === "MANAGE_GUILD" ||
              perm === "MANAGE_CHANNELS"
          );
        // Now we can check if they have the appropriate role
        if (!modRole)
          modRole = member.roles.find(role => role.name === config.modRole);
        resolve(modRole ? true : false);
      })
      .catch(err => {
        log(`Couldn't get info for ${author.username}`, qChannel);
        log(err);
        resolve(false);
      })
  );
};

export const isDm = (author, qChannel) => {
  return qChannel.isDM;
};

export const isNotDm = (author, qChannel) => {
  return !qChannel.isDM;
};
