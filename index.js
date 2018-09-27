var fortune = require('fortune-teller');

// Config file
var config = require('./config.json');
// Passwords file
var pw = require('./pw.json');
// Usage strings
var usage = require('./usage.js');

// Modules
let post = require('./post');
let twitter = require('./twitter');
let users = require('./users');
let gets = require('./gets');
let discord = require('./discord');

function getLatestPic(channel, screenName) {
    twitter.userTimeline({screen_name:screenName})
        .then(function(tweets, error) {
            if (tweets.length < 1) {
                post.message(channel, "It doesn't look like " + screenName + " has any tweets... ");
                return;
            }
            let tweet = tweets[0];
            post.tweet(channel, tweet, true);
        })
        .catch(function(error){
            post.message(channel, "Something went wrong fetching this user's last tweet, sorry! :c");
            console.error(error);
        });
}

discord.onMessage((message) => {
    // Ignore bots
    if (message.author.bot) return;

    if (message.content.indexOf(config.prefix) !== 0)
    {
        if (!!(message.mentions) && !!(message.mentions.members) && message.mentions.members.find(item => item.user.id === discord.user().id)) {
            message.reply(fortune.fortune());
        }
        else if (message.channel.type == "dm")
            post.message(message.channel, "Hello, I'm " + config.botName + "! Type " + config.prefix + "help to see a list of my commands! ❤");
        return ;
    }
    let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    if (command === "help" || command === "?")
    {
        const embed = new Discord.RichEmbed()
              .setColor(0xD667CF)
              .setTitle(config.botName)
              .setURL(config.githubURL)
              .setDescription("Hello, I am " + config.botName + ", I'm a very simple bot who cross-posts twitter posts to Discord channels!\nWant to invite me to your server? [Click here](https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=0)!\nHere's a list of what I can do:")
              .setFooter("*: Anyone can perform these commands. Issues, suggestions? My creator is Tom'#4242")
              .addField(config.prefix + "tweet*", usage["tweet"])
              .addField(config.prefix + "startget", usage["startget"])
              .addField(config.prefix + "stopget", usage["stopget"])
              .addField(config.prefix + "list*", usage["list"])
              .addField(config.prefix + "help*", "Print this help message.");
        post.embed(message.channel, {embed}, false);
    }

    if (command === "tweet") {
        if (args.length < 1)
        {
            post.message(message.channel, usage["tweet"]);
            return;
        }
        let screenName = args[0];
        getLatestPic(message.channel, screenName);
    }

    if (command === "startget")
    {
        if (message.channel.type === "dm") {
            post.message(message.channel, "Sorry, but I can't automatically post in DMs for now!");
            return;
        }
        // Only take commands from guild owner or creator
        if (!(message.author.id === config.ownerId ||
              message.author.id === message.channel.guild.ownerID))
        {
            post.message(message.channel, "Sorry, only my creator and the server owner can do this for now!");
            return;
        }
        if (args.length < 1) {
            post.message(message.channel, usage["startget"]);
            return;
        }
        let options = users.defaultOptions();
        let screenName = null;
        for (let arg of args) {
            if (arg.substring(0,2) == "--") {
                let option = arg.substring(2);
                if (option === "notext")
                    options.text = false;
            }
            else if (screenName == null) {
                screenName = arg;
            }
            else {
                post.message(message.channel, "Invalid argument: " + arg);
                return;
            }
        }
        twitter.userLookup({'screen_name' : screenName})
            .then(function(data) {
                post.message(message.channel, "I'm starting to get tweets from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
                let userId = data[0].id_str;
                // Re-register the stream if we didn't know the user before
                let redoStream = !users.collection.hasOwnProperty(userId);
                gets.add(message.channel, userId, screenName, options);
                if (redoStream) {
                    twitter.createStream();
                }
                users.save();
            })
            .catch(function(error) {
                console.error(new Date() + ": Failed to find the user a client specified (" + screenName + "):");
                console.error(error);
                post.message(message.channel, "I can't find a user by the name of " + screenName);
                return;
            });
    }

    if (command === "stopget")
    {
        // Only take commands from guild owner or creator
        if (!(message.author.id === config.ownerId ||
              message.author.id === message.channel.guild.ownerID))
        {
            post.message(message.channel, "Sorry, only my creator and the server owner can do this for now!");
            return;
        }

        if (args.length < 1)
        {
            post.message(message.channel, usage["stopget"]);
            return;
        }
        let screenName = args[0];
        gets.rm(message.channel, screenName);
    }

    if (command === "list")
    {
        if (message.author.id === config.ownerId && message.channel.type === "dm") {
            users.adminList(message.channel);
        }
        else  {
            users.list(message.channel);
        }
    }
    
    // Admin only commands
    if (message.author.id === config.ownerId && message.channel.type === "dm")
    {
        if (command === "leave") {
            // Leave the given server
            if (args.length < 1)
            {
                post.message(message.channel, "Please give me a guild id");
                return;
            }
            let guild = discord.getGuild(args[0]);
            if (guild == undefined) {
                post.message(message.channel, "I couldn't find guild: " + args[0]);
                return;
            }
            // Leave the guild
            guild.leave()
            .then(g => {
                console.log(`Left the guild ${g}`);
                post.message(message.channel, `Left the guild ${g}`);
            })
            .catch(console.error);
        }
    }
});

discord.onError((error) => {
    console.error(new Date() + ": Discord client encountered an error");
    console.error(error);
});

discord.onGuildCreate((guild) => {
    // Message the guild owner with useful information
    guild.owner.send("Hello, I'm " + config.botName + ", thanks for inviting me to your server!\nBefore I can start getting tweets I'll need a text channel where I have permission to write messages & send embeds, please. It'd be nice if I could get reaction permissions in it, too!\nYou can get a list of my commands with `" + config.prefix + "help`. Please enjoy my services.");
});

function rmGuild(guild) {
    // Remove all instances of this guild from our gets
    Object.keys(users.collection).forEach(userId => {
        let user = users.collection[userId];
        var i = user.channels.length;
        while (i--) {
            if (guild.id === user.channels[i].channel.guild.id) {
                // We should remove this get
                user.channels.splice(i, 1);
            }
        }
        if (user.channels.length < 1) {
            // If no one needs this user's tweets we can delete the enty
            delete users.collection[userId];
        }
    });
    // Save any changes we did to the users object
    users.save();
    // ...and re-register the stream, which will be properly updated
    twitter.createStream();
}

discord.onGuildDelete(rmGuild);

discord.onReady(() => {
    // If our name changed, set it
    if (discord.user().username !== config.botName) {
        discord.user().setUsername(config.botName);
    }
    users.load(() => {
        // All users have been registered, we can request the stream from Twitter
        twitter.createStream();
        // ... And save any changes we made
        users.save();
    });
});

process.on('unhandledRejection', function(err) {
    console.error(new Date() + ": Unhandled exception");
    console.error(err);
});

console.log("Server launched at " + new Date());
discord.login(pw.dToken);
