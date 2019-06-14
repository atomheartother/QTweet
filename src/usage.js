var config = require("../config.json");

module.exports = {
  tweet: `Post the latest tweet from the given user.\n**Usage**: \`${
    config.prefix
  }tweet <twitter screen name>\``,
  start: `Subscribe to a twitter user, getting their tweets in real time.\n**Usage**: \`${
    config.prefix
  }start <twitter screen name> [--notext]\`\nI can take up to 20 minutes to start posting their tweets.\nYou can add multiple twitter users by separating their screen names with spaces.`,
  stop: `Unsubscribe from the given user.\nUsage: \`${
    config.prefix
  }stop <twitter screen name>\``,
  stopchannel: `Exactly like stop but acts on the whole channel.\n**Usage**: \`${
    config.prefix
  }stopchannel [channel ID]\``,
  list:
    "Print a list of the twitter users you're currently subscribed to."
};
