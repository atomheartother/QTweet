const config = require("../config.json");

let checks = (module.exports = {});
const log = require("./log");

// Takes an author and returns whether or not they are an admin
checks.isAdmin = (author, qChannel, callback) => {
  callback(author.id === config.ownerID);
};

// Takes an author. checks that they're able to perform mod-level commands
checks.isMod = async (author, qChannel, callback) => {
  const ownerId = await qChannel.ownerId();
  const guild = await qChannel.guild();
  const isSomeOwner =
    author.id === config.ownerID || (!!qChannel && author.id === ownerId);
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

checks.isDm = (author, qChannel, callback) => {
  callback(qChannel.type === "dm");
};

checks.isNotDm = (author, qChannel, callback) => {
  callback(qChannel.type !== "dm");
};
