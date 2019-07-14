import * as config from "../config.json";
import log from "./log";

// Takes an author and returns whether or not they are an admin
export const isAdmin = (author, qChannel, callback) => {
  callback(author.id === config.ownerID);
};

// Takes an author. checks that they're able to perform mod-level commands
export const isMod = async (author, qChannel, callback) => {
  const guild = await qChannel.guild();
  const isSomeOwner =
    author.id === config.ownerID ||
    (!!qChannel && author.id === qChannel.ownerId());
  if (isSomeOwner)
    // The user is either the channel owner or us. We can just accept their command
    callback(true);
  else if (qChannel && !!guild) {
    // Less fun part. We need to get their GuildMember object first of all
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
        callback(modRole ? true : false);
      })
      .catch(err => {
        log(`Couldn't get info for ${author.username}`, qChannel);
        log(err);
        callback(false);
      });
  } else {
    callback(false);
  }
};

export const isDm = (author, qChannel, callback) => {
  callback(qChannel.isDM);
};

export const isNotDm = (author, qChannel, callback) => {
  callback(!qChannel.isDM);
};
