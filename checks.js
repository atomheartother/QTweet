const config = require("./config.json");

let checks = (module.exports = {});

// Takes an author and returns whether or not they are an admin
checks.isAdmin = (author, channel) => {
  return author.id === config.ownerID;
};

// Takes an author. checks that they're able to perform mod-level commands
checks.isMod = (author, channel) => {
  return (
    checks.isAdmin(author) ||
    author.id === channel.guild.ownerID ||
    (checks.isDm(author, channel) && author.roles.exists("name", "qtweet"))
  );
};

checks.isDm = (author, channel) => {
  return channel.type === "dm";
};

checks.isNotDm = (author, channel) => {
  return !checks.isDm(author, channel);
};
