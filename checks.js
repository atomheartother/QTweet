const config = require("./config.json");

let checks = (module.exports = {});
const log = require("./log");

// Takes an author and returns whether or not they are an admin
checks.isAdmin = (author, channel, callback) => {
  callback(author.id === config.ownerID);
};

// Takes an author. checks that they're able to perform mod-level commands
checks.isMod = (author, channel, callback) => {
  const isSomeOwner =
    author.id === config.ownerID ||
    (!!channel.guild && author.id === channel.guild.ownerID);
  if (isSomeOwner)
    // The user is either the channel owner or us. We can just accept their command
    callback(true);
  else {
    // Less fun part. We need to get their GuildMember object first of all
    channel.guild
      .fetchMember(author)
      .then(member => {
        // Are they an admin or have global management rights? (means they're a moderator)
        const modRole = member.permissions
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
      .catch(() => {
        log(`Couldn't get info for ${author.name}`, channel);
        log(author);
        callback(false);
      });
  }
};

checks.isDm = (author, channel, callback) => {
  callback(channel.type === "dm");
};

checks.isNotDm = (author, channel, callback) => {
  callback(channel.type !== "dm");
};
