var fs = require('fs');

var Twitter = require('twitter');
const Discord = require('discord.js');
var fortune = require('fortune-teller');

// Config file
var config = require('./config.json');
// Passwords file
var pw = require('./pw.json');

var dClient = new Discord.Client();

var tClient = new Twitter({
    consumer_key: pw.tId,
    consumer_secret: pw.tSecret,
    access_token_key: pw.tToken,
    access_token_secret: pw.tTokenS
});

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   channels: Array of Gets
//   Get:
//    channel: channel object
var users = {};

// Stream object, holds the twitter feed we get posts from
var stream = null;

// Register the stream with twitter
function createStream() {
    if (stream != null)
        stream.destroy();
    stream = null;

    let userIds = [];
    // Get all the user IDs
    for (let id in users) {
        if (!users.hasOwnProperty(id)) continue;

        userIds.push(id);
    }
    // If there are none, we can just leave stream at null
    if (userIds.length < 1)
        return;

    // Else, register the stream using our userIds
    stream = tClient.stream('statuses/filter', {follow: userIds.toString()});
    stream.on('data', function(tweet) {
        if ((tweet.hasOwnProperty('in_reply_to_user_id')
             && tweet.in_reply_to_user_id !== null) ||
            tweet.hasOwnProperty('retweeted_status'))
            // This is a reply or a retweet, ignore it
            return;
        if (!users.hasOwnProperty(tweet.user.id_str)) {
            // Somehow we got a tweet from someone we don't follow anymore.
            console.error("We got a tweet from someone we don't follow:");
            console.error(tweet);
            return;
        }
        for (let get of users[tweet.user.id_str].channels) {
            postTweet(get.channel, tweet);
        }
    });

    stream.on('error', function(err) {
        console.error("Error getting a stream");
        console.error(err);
    });
}

function saveUsers() {
    // We save users as:
    // {
    //    "userId" : {name: "screen_name", channels: [channelId1, channelId2]}
    // }

    // Create a copy of the channels object, remove all timeouts from it
    let usersCopy = {};
    for (let userId in users) { // Iterate over twitter users
        if (!users.hasOwnProperty(userId)) continue;
        usersCopy[userId] = {channels:[]};
        if (users[userId].hasOwnProperty('name')) {
            usersCopy[userId].name = users[userId].name;
        }
        for (let get of users[userId].channels) {
            usersCopy[userId].channels.push(get.channel.id);
        }
    }
    console.log("Saving users:");
    console.log(usersCopy);
    let json = JSON.stringify(usersCopy);
    fs.writeFile(config.getFile, json, 'utf8', function(err) {
        if (err !== null) {
            console.error("Error saving users object:");
            console.error(err);
        }
    });
};

function loadUsers() {
        fs.stat(config.getFile, function(err, stat) {
        if (err == null) {
            console.log("Loading gets from " + config.getFile);
            fs.readFile(config.getFile, 'utf8', function(err, data) {
                if (err) {
                    console.error("There was a problem reading the config file");
                    return;
                }
                // Restore the channels object from saved file
                let usersCopy = JSON.parse(data);
                for (let userId in usersCopy) { // Iterate over users
                    if (!usersCopy.hasOwnProperty(userId)) continue;

                    let name = usersCopy[userId].hasOwnProperty('name') ? usersCopy[userId].name : null;
                    let channels = usersCopy[userId].channels;
                    for (let channelId of channels) { // Iterate over gets in channels
                        let channel = dClient.channels.get(channelId);
                        if (channel === undefined) {
                            console.error("W: Tried to load undefined channel: " + channelId);
                            continue;
                        }
                        addGet(channel, userId, name);
                    }
                }
                // All users have been registered, we can request the stream from Twitter
                createStream();
                saveUsers();
                console.log("\nLoaded gets:");
                console.log(users);
            });
        }
    });
}

function listUsers(channel) {
    let userIds = [];
    for (let userId in users) {
        if (!users.hasOwnProperty(userId)) continue;

        let twitterUser = users[userId];

        for (let get of twitterUser.channels) {
            if (get.channel.id === channel.id) {
                userIds.push(userId);
            }
        }
    }

    if (userIds.length < 1) {
        channel.send("You aren't fetching tweets from anywhere!");
        return;
    }
    let str = "You're fetching tweets from:";
    for (let userId of userIds) {
        if (users[userId].hasOwnProperty('name')) {
            str += "\n- " + users[userId].name;
        }
        else
            str += "\n- ID: " + userId + " (I don't know their name yet, I need a tweet from them!)";
    }
    channel.send(str);
}

function postEmbed(channel, embed, react) {
    channel.send(embed)
        .then(function(message) {
            if (react)
                message.react("❤");
        })
        .catch(function(error){
            channel.send("I tried to respond but Discord won't let me! Did you give me permissions to send embed links?\nDiscord had this to say:\n`" + error.name + ": " + error.message + "`")
                .catch(function(error) {
                    console.log("It appears that channel " + channel.id + " doesn't exist anymore. Removing it");
                    rmGet(channel, embed.author.screenName);
                });
        });
}

function postTweet(channel, tweet) {
    // Author doesn't have a screenName field,
    // we use it for debugging and for error handling
    let embed = {
        "author": {
            "name": tweet.user.name,
            "screenName" : tweet.user.screen_name,
            "url": "https://twitter.com/" + tweet.user.screen_name,
            "icon_url": tweet.user.profile_image_url_https
        },
        "description": tweet.text,
    };
    if (users.hasOwnProperty(tweet.user.id_str) &&
        !users[tweet.user.id_str].hasOwnProperty('name')) {
        // if we don't have that user's name, add it to our list
        users[tweet.user.id_str].name = tweet.user.screen_name;
        saveUsers();
    }
    if (!(tweet.hasOwnProperty('extended_entities') &&
          tweet.extended_entities.hasOwnProperty('media') &&
          tweet.extended_entities.media.length > 0))
    {
        // Text tweet
        embed.color = 0x69B2D6;
    }
    else if (tweet.extended_entities.media[0].type === "animated_gif" ||
             tweet.extended_entities.media[0].type === "video")
    {
        // Gif/video. We can't make it clickable, but we can make the tweet redirect to it
        let vidinfo = tweet.extended_entities.media[0].video_info;
        let vidurl = null;
        for (let vid of vidinfo.variants) {
            if (vid.content_type === "video/mp4")
                vidurl = vid.url;
        }
        let  imgurl = tweet.extended_entities.media[0].media_url_https;
        if (vidurl !== null) {
            embed.title = tweet.text;
            embed.description = "[Link to video](" + vidurl + ")";
        }
        embed.color = 0x67D67D;
        embed.image = { "url": imgurl };
    }
    else
    {
        // Image
        let imgurl = tweet.extended_entities.media[0].media_url_https;
        embed.color = 0xD667CF;
        embed.image = { "url": imgurl };
    }
    postEmbed(channel, {embed}, true);
}

// Add a get to the user list
function addGet(channel, userId, screenName) {
    if (!users.hasOwnProperty(userId)) {
        // Create the user object
        users[userId] = {channels : []};
    }
    if (screenName != null && !users[userId].hasOwnProperty('name')) {
        users[userId].name = screenName;
    }

    for (let get of users[userId].channels) {
        // Get is already in there for this channel
        if (get.channel.id == channel.id)
            return;
    }

    users[userId].channels.push({
        "channel" : channel,
    });
}

// Remove a get from the user list
// This function doesn't save to fs automatically
function rmGet(channel, screenName) {
    tClient.get('users/lookup', {screen_name : screenName})
        .then(function(data) {
            let userId = data[0].id_str;
            if (!users.hasOwnProperty(userId))
            {
                channel.send("You're not currently `get`ting this user. Use `" + config.prefix + "startget "+ screenName +"` to do it!");
                return;
            }
            let idx = -1;
            for (let i = 0 ; i < users[userId].channels.length ; i++)
            {
                let curChannel = users[userId].channels[i].channel;
                if (curChannel.id == channel.id) {
                    idx = i;
                    break;
                }
            }
            if (idx == -1) {
                channel.send("You're not currently `get`ting this user. Use `" + config.prefix + "startget "+ screenName +"` to do it!");
                return;
            }
            // Remove element from channels
            users[userId].channels.splice(idx, 1);
            if (users[userId].channels.length < 1) {
                // If no one needs this user's tweets we can delete the enty
                delete users[userId];
                // ...and re-register the stream, which will now delete the user
                createStream();
            }
            channel.send("It's gone!");
            saveUsers();
        })
        .catch(function(err) {
            console.error(err);
            channel.send("I can't find a user by the name of " + screenName);
        });
}

function getLatestPic(channel, screenName) {
    tClient.get('statuses/user_timeline', {screen_name:screenName})
        .then(function(tweets, error){
            if (tweets.length < 1) {
                channel.send("It doesn't look like " + screenName + " has any tweets... ");
                return;
            }
            let tweet = tweets[0];
            postTweet(channel, tweet);
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
              .setTitle("A.I.kyan")
              .setDescription("Here is the list of my commands:")
              .setFooter("Issues, suggestions? My creator is Tom'#4242")
              .setDescription("")
              .addField(config.prefix + "tweet", "Get the latest tweet from the given user and post it.\nUsage: `" + config.prefix + "tweet <twitter screen name>`")
              .addField(config.prefix + "startget", "{}ost a twitter user's tweets in real time.\nUsage: `" + config.prefix + "startget <twitter screen name>`")
              .addField(config.prefix + "stopget", "Stop automatically posting tweets from the given user.\nUsage: `" + config.prefix + "stopget <twitter screen name>`")
              .addField(config.prefix + "list", "Print a list of the twitter users you're currently fetching tweets from.")
              .addField(config.prefix + "list", "Print this help message.")
              .addBlankField()
              .addField("**Get A.I.Kyan**", "Want to invite me to your server? [Click here](https://discordapp.com/oauth2/authorize?client_id=433615162394804224&scope=bot&permissions=0)!", true)
              .addField("**Source code**", "You can find me on [GitHub](https://github.com/atomheartother/A-I-kyan)!", true)
              .addBlankField();

        postEmbed(message.channel, {embed}, false);
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
        if (message.channel.type === "dm") {
            message.channel.send("Sorry, but I can't automatically post in DMs for now!");
            return;
        }
        let screenName = args[0];
        tClient.get('users/lookup', {'screen_name' : screenName})
            .then(function(data) {
                message.channel.send("I'm starting to get tweets from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
                let userId = data[0].id_str;
                addGet(message.channel, userId, screenName);
                saveUsers();
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
        rmGet(message.channel, screenName);
    }

    if (command === "list")
    {
        listUsers(message.channel);
    }
});

dClient.on('ready', () => {
    loadUsers();
});

dClient.login(pw.dToken);
