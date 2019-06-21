import * as config from "../config.json";

export default {
  tweet: `Post the latest tweet(s) from the given user.\n**Usage**: \`${
    config.prefix
  }tweet <twitter_screen_name> [count]\``,
  start: `Subscribe to a twitter user and post their tweets in real time.\n**Usage**: \`${
    config.prefix
  }start <twitter_screen_name> [--notext] [--retweet] [--noquote] [--ping]\`\nYou can add multiple twitter users by separating their screen names with spaces.`,
  stop: `Unsubscribe from the given user.\n**Usage**: \`${
    config.prefix
  }stop <twitter_screen_name>\``,
  stopchannel: `Exactly like ${
    config.prefix
  }stop but acts on the whole channel.\n**Usage**: \`${
    config.prefix
  }stopchannel [channel ID]\``,
  list: "Print a list of the twitter users you're currently subscribed to.",
  admin: `Access info about all servers.\n**Usage**: \`${
    config.prefix
  }admin <channel|twitter>\``
};
