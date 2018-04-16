var Twitter = require('twitter');
const Discord = require('discord.js');
var fortune = require('fortune-teller');

// Config file
var config = require('./config.json');

var dClient = require('./dClient.js');
var tClient = require('./tClient.js');
var userList = require('./userList.js');
var users = require('./users.js');
var post = require('./post.js');


function getLatestPic(channel, screenName) {
    tClient.get('statuses/user_timeline', {screen_name:screenName})
        .then(function(tweets, error){
            if (tweets.length < 1) {
                channel.send("It doesn't look like " + screenName + " has any tweets... ");
                return;
            }
            let tweet = tweets[0];
            post.tweet(channel, tweet);
        })
        .catch(function(error){
            channel.send("Something went wrong fetching this user's last tweet, sorry! :c");
            console.error(error);
        });
}

dClient.on('message', (message) => {
    // Ignore bots
    if (message.author.bot) return;

    if (message.content.indexOf(config.prefix) !== 0)
    {
        if (message.mentions.members.find(item => item.user.id === dClient.user.id)) {
            message.reply(fortune.fortune());
        }
        else if (message.channel.type == "dm")
            message.channel.send("Hello, I am A.I.kyan! Type " + config.prefix + "help to see a list of my commands! ❤");
        return ;
    }
    let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    // Only take commands from guild owner or creator
    if (!(message.author.id === config.ownerId ||
          message.author.id === message.channel.guild.ownerID))
    {
        message.channel.send("Sorry, I only take orders from the server owner and from my creator for now!");
        return;
    }

    if (command === "help" || command === "?")
    {
        const embed = new Discord.RichEmbed()
              .setColor(0xD667CF)
              .setTitle("A.I.kyan's Command List")
              .setDescription("This is all the things I can currently do:")
              .setFooter("Issues, suggestions? My creator is Tom'#4242")
              .addField(config.prefix + "tweet", "This command will get the latest tweet from the given user and post it.\nUsage: `" + config.prefix + "tweet <twitter screen name>`")
              .addField(config.prefix + "startget", "This command will post a twitter user's tweets in real time.\nUsage: `" + config.prefix + "startget <twitter screen name>`")
              .addField(config.prefix + "stopget", "This command will stop automatically posting tweets from the given user.\nUsage: `" + config.prefix + "stopget <twitter screen name>`")
              .addField(config.prefix + "list", "Will print out a list of the twitter users you're currently fetching tweets from.");

        post.embed(message.channel, {embed}, false);
    }

    if (command === "tweet") {
        if (args.length < 1)
        {
            message.channel.send("This command will get the latest tweet from the given user and post it..\nUsage: `" + config.prefix + "tweet <twitter screen name>`");
            return;
        }
        let screenName = args[0];
        getLatestPic(message.channel, screenName);
    }

    if (command === "startget")
    {
        if (args.length < 1) {
            message.channel.send("This command will post a twitter user's tweets in real time.\nUsage: `" + config.prefix + "startget <twitter screen name>`");
            return;
        }
        let screenName = args[0];
        tClient.get('users/lookup', {'screen_name' : screenName})
            .then(function(data) {
                message.channel.send("I'm starting to get tweets from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
                let userId = data[0].id_str;
                users.add(message.channel, userId, screenName);
                users.save();
            })
            .catch(function(error) {
                console.error(error);
                message.channel.send("I can't find a user by the name of " + screenName);
                return;
            });
    }

    if (command === "stopget")
    {
        if (args.length < 1)
        {
            message.channel.send("This command will stop automatically posting tweets from the given user.\nUsage: `" + config.prefix + "stopget <twitter screen name>`");
            return;
        }
        let screenName = args[0];
        users.rm(message.channel, screenName);
    }

    if (command === "list")
    {
        users.showList(message.channel);
    }
});

dClient.on('ready', () => {
    users.load();
});
