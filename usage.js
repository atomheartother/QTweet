var config = require("./config.json");

module.exports = {
  tweet: `Get the latest tweet from the given user and post it.\nUsage: \`${
    config.prefix
  }tweet <twitter screen name>\``,
  start: `Post a twitter user's tweets in real time.\nUsage: \`${
    config.prefix
  }start <twitter screen name> [--notext]\``,
  stop: `Stop automatically posting tweets from the given user.\nUsage: \`${
    config.prefix
  }stop <twitter screen name>\``,
  list:
    "Print a list of the twitter users you're currently fetching tweets from."
};
