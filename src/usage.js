var config = require("../config.json");

module.exports = {
  tweet: `Post the latest tweet(s) from the given user.\n**Usage**: \`${
    config.prefix
  }tweet <twitter_screen_name> [count]\``,
  start: `Subscribe to a twitter user, getting their tweets in real time.\n**Usage**: \`${
    config.prefix
  }start <twitter_screen_name> [--notext] [--retweet]\`\nI can take up to 20 minutes to start posting their tweets.\nYou can add multiple twitter users by separating their screen names with spaces.`,
  stop: `Unsubscribe from the given user.\n**Usage**: \`${
    config.prefix
  }stop <twitter_screen_name>\``,
  stopchannel: `Exactly like stop but acts on the whole channel.\n**Usage**: \`${
    config.prefix
  }stopchannel [channel ID]\``,
  list: "Print a list of the twitter users you're currently subscribed to.",
  admin: `Access info about all servers.\n**Usage**: \`${
    config.prefix
  }admin <channel|twitter>\``
};
