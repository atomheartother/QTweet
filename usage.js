var config = require('./config.json');

module.exports = {
    "tweet" : "Get the latest tweet from the given user and post it.\nUsage: `" + config.prefix + "tweet <twitter screen name>`",
    "startget"  : "Post a twitter user's tweets in real time.\nUsage: `" + config.prefix + "startget <twitter screen name> [--notext]`",
    "stopget" : "Stop automatically posting tweets from the given user.\nUsage: `" + config.prefix + "stopget <twitter screen name>`",
    "list" : "Print a list of the twitter users you're currently fetching tweets from.",
};
