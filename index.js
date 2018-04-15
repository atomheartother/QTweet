var Twitter = require('twitter');
const Discord = require('discord.js');
const fs = require('fs');

// Config & password files
var config = require('./config.json');
var pw = require('./pw.json')

var tClient = new Twitter({
    consumer_key: pw.tId,
    consumer_secret: pw.tSecret,
    access_token_key: pw.tToken,
    access_token_secret: pw.tTokenS
});

const dClient = new Discord.Client();

// This is the stream variable, which handles receiving the twitter feed
var stream = null;

// Users:
// Dict of TwitterUser, using userId as key
//  TwitterUser:
//   name: screen name
//   channels: Array of Gets
//   Get:
//    channel: channel object
var users = {};

function sendEmbed(channel, embed) {
    channel.send(embed)
        .then(function(message) {
            message.react("❤");
        })
        .catch(function(error){
            channel.send("I tried to respond but Discord won't let me! Did you give me permissions to send embed links?\nDiscord had this to say:\n`" + error.name + ": " + error.message + "`");
        });
}

// Register the stream with twitter
function createStream() {
    if (stream != null)
        stream.destroy();
    stream = null;

    var userIds = [];
    // Get all the user IDs
    for (var id in users) {
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
        for (var get of users[tweet.user.id_str].channels) {
            postTweet(get.channel, tweet);
        }
    });

    stream.on('error', function(err) {
        console.error("Error getting a stream");
        console.error(err);
    });
}

function addGet(channel, userId, screenName) {
    if (!users.hasOwnProperty(userId)) {
        // Create the user object
        users[userId] = {channels : []};
    }
    if (screenName != null && !users[userId].hasOwnProperty('name')) {
        users[userId].name = screenName;
    }

    for (var get of users[userId].channels) {
        // Get is already in there for this channel
        if (get.channel.id == channel.id)
            return;
    }

    users[userId].channels.push({
        "channel" : channel,
    });
}

// We save users as:
// {
//    "userId" : {name: "screen_name", channels: [channelId1, channelId2]}
// }
function saveUsers() {
    // Create a copy of the channels object, remove all timeouts from it
    console.log("Saving users...");
    console.log(users);
    var usersCopy = {};
    for (var userId in users) { // Iterate over twitter users
        if (!users.hasOwnProperty(userId)) continue;

        usersCopy[userId] = {channels:[]};
        if (users[userId].hasOwnProperty('name')) {
            usersCopy[userId].name = users[userId].name;
        }
        for (var get of users[userId].channels) {
            usersCopy[userId].channels.push(get.channel.id);
        }
    }
    console.log("Saved copy:");
    console.log(usersCopy);
    var json = JSON.stringify(usersCopy);
    fs.writeFile(config.getFile, json, 'utf8', function(err) {
        if (err !== null) {
            console.error("Error saving users object:");
            console.error(err);
        }
    });
}

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
                var usersCopy = JSON.parse(data);
                for (var userId in usersCopy) { // Iterate over users
                    if (!usersCopy.hasOwnProperty(userId)) continue;

                    var name = usersCopy[userId].hasOwnProperty('name') ? usersCopy[userId].name : null;
                    var channels = usersCopy[userId].channels;
                    for (var channelId of channels) { // Iterate over gets in channels
                        var channel = dClient.channels.get(channelId);
                        addGet(channel, userId, name);
                    }
                }
                // All users have been registered, we can request the stream from Twitter
                createStream();
            });
        }
    });
}

function postTweet(channel, tweet) {
    var embed = {
        "author": {
            "name": tweet.user.name,
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
        var vidinfo = tweet.extended_entities.media[0].video_info;
        var vidurl = null;
        for (var vid of vidinfo.variants) {
            if (vid.content_type === "video/mp4")
                vidurl = vid.url;
        }
        var imgurl = tweet.extended_entities.media[0].media_url_https;
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
        var imgurl = tweet.extended_entities.media[0].media_url_https;
        embed.color = 0xD667CF;
        embed.image = { "url": imgurl };
    }
    sendEmbed(channel, {embed});
}

function getLatestPic(channel, screenName) {
    tClient.get('statuses/user_timeline', {screen_name:screenName})
        .then(function(tweets, error){
            if (tweets.length < 1) {
                return channel.send("It doesn't look like " + screenName + " has any tweets... ");
            }
            var tweet = tweets[0];
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
        if (message.channel.type == "dm")
            message.channel.send("Hello, I am A.I.kyan! Type " + config.prefix + "help to see a list of my commands! ❤");
        return ;
    }
    var args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    var command = args.shift().toLowerCase();

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
              .addField(config.prefix + "list", "Will print out a list of the twitter users you're currently fetching tweets from.")

        sendEmbed(message.channel, {embed});
    }

    if (command === "tweet") {
        if (args.length < 1)
            return message.channel.send("This command will get the latest tweet from the given user and post it..\nUsage: `" + config.prefix + "tweet <twitter screen name>`");
        var screenName = args[0];
        getLatestPic(message.channel, screenName);
    }

    if (command === "startget")
    {
        if (args.length < 1)
            return message.channel.send("This command will post a twitter user's tweets in real time.\nUsage: `" + config.prefix + "startget <twitter screen name>`");
        var screenName = args[0];
        tClient.get('users/lookup', {'screen_name' : screenName})
            .then(function(data) {
                message.channel.send("I'm starting to get tweets from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
                var userId = data[0].id_str;
                addGet(message.channel, userId, screenName);
                saveUsers();
            })
            .catch(function(error) {
                console.error(error);
                return message.channel.send("I can't find a user by the name of " + screenName);
            });
    }

    if (command === "stopget")
    {
        if (args.length < 1)
            return message.channel.send("This command will stop automatically posting tweets from the given user.\nUsage: `" + config.prefix + "stopget <twitter screen name>`");
        var screenName = args[0];
        tClient.get('users/lookup', {screen_name : screenName})
            .then(function(data) {
                var userId = data[0].id_str;
                if (!users.hasOwnProperty(userId))
                    return message.channel.send("You're not currently `get`ting this user. Use `" + config.prefix + "startget "+ screenName +"` to do it!");
                var idx = -1;
                for (var i = 0 ; i < users[userId].channels.length ; i++)
                {
                    var channel = users[userId].channels[i].channel;
                    if (channel.id == message.channel.id)
                    {
                        idx = i;
                    }
                }
                if (idx == -1)
                    message.channel.send("You're not currently `get`ting this user. Use `" + config.prefix + "startget "+ screenName +"` to do it!");
                else
                {
                    // Remove element from channels
                    users[userId].channels.splice(idx);
                    // If channels is empty, we can delete the entry
                    if (users[userId].channels.length == 0) {
                        delete users[userId];
                        // ...and re-register the stream
                        // This will also delete the stream if there are no users left
                        createStream();
                    }

                   message.channel.send("It's gone!");
                    saveUsers();
                    return;

                }
            })
            .catch(function(err) {
                return message.channel.send("I can't find a user by the name of " + screenName);
            });
    }
    if (command === "list")
    {
        var userIds = [];
        for (var userId in users) {
            if (!users.hasOwnProperty(userId)) continue;

            var twitterUser = users[userId];

            for (var get of twitterUser.channels) {
                if (get.channel.id === message.channel.id) {
                    userIds.push(userId);
                }
            }
        }

        if (userIds.length < 1) {
            return message.channel.send("You aren't fetching tweets from anywhere!");
        }
        var str = "You're fetching tweets from:";
        for (var userId of userIds) {
            if (users[userId].hasOwnProperty('name')) {
                str += "\n- " + users[userId].name;
            }
            else
                str += "\n- ID: " + userId + " (I don't know their name yet, I need a tweet from them!)";
        }
        message.channel.send(str);
    }
});

dClient.on('ready', () => {
    loadUsers();
});

dClient.login(pw.dToken);
