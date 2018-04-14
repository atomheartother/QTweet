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
// TwitterUser:
// channels: Array of Gets
// Get:
// channel: channel object
var users = {};

// Register the stream with twitter
function createStream() {
    if (stream != null)
        stream.destroy();
    stream = null;

    userIds = [];
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

    stream.on('data', function(tweet, err) {
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

function addGet(channel, userId) {
    if (!users.hasOwnProperty(userId)) {
        // Create the user object
        users[userId] = {channels : []};
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
//    "userId" : {channels: [channelId1, channelId2]}
// }
function saveUsers() {
    // Create a copy of the channels object, remove all timeouts from it
    console.log("Saving users...");
    console.log(users);
    var usersCopy = {};
    for (var userId in users) { // Iterate over twitter users
        if (!users.hasOwnProperty(userId)) continue;

        usersCopy[userId] = {channels:[]};
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
            console.log("Found a get file at " + config.getFile);
            fs.readFile(config.getFile, 'utf8', function(err, data) {
                if (err) {
                    console.error("There was a problem reading the config file");
                    return;
                }
                // Restore the channels object from saved file
                var usersCopy = JSON.parse(data);
                for (var userId in usersCopy) { // Iterate over users
                    if (!usersCopy.hasOwnProperty(userId)) continue;

                    var channels = usersCopy[userId].channels;
                    for (var channelId of channels) { // Iterate over gets in channels
                        var channel = dClient.channels.get(channelId);
                        addGet(channel, userId);
                    }
                }
                // All users have been registered, we can request the stream from Twitter
                createStream();
            });
        }
    });
}

function postTweet(channel, tweet) {
    var embed = null;
    if (!(tweet.hasOwnProperty('extended_entities') &&
          tweet.extended_entities.hasOwnProperty('media') &&
          tweet.extended_entities.media.length > 0))
    {
        embed = new Discord.RichEmbed()
            .setAuthor(tweet.user.name, tweet.user.profile_image_url_https)
            .setColor(0x69B2D6)
            .setDescription(tweet.text)
    }
    else
    {
        var imgurl = tweet.extended_entities.media[0].media_url_https;
        embed = new Discord.RichEmbed()
            .setAuthor(tweet.user.name, tweet.user.profile_image_url_https)
            .setColor(0xD667CF)
            .setFooter(tweet.text)
            .setImage(tweet.extended_entities.media[0].media_url_https);
    }
    channel.send({embed});
}

function getLatestPic(channel, screenName) {
    tClient.get('statuses/user_timeline', {screen_name:screenName})
        .then(function(tweets){
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

    if (command === "help" || command === "?")
    {
        const embed = new Discord.RichEmbed()
              .setColor(0xD667CF)
              .setTitle("A.I.kyan's Command List")
              .setDescription("This is all the things I can currently do:")
              .setFooter("Issues, suggestions? My creator is Tom'#4242")
              .addField(config.prefix + "pic", "This command will get the latest tweet from the given user and post its picture.\nUsage: `" + config.prefix + "pic <twitter screen name>`")
              .addField(config.prefix + "startget", "This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + config.prefix + "startget <twitter screen name>`")
              .addField(config.prefix + "stopget", "This command will stop automatically fetching pictures from a twitter user\nUsage: `" + config.prefix + "stopget <twitter screen name>`")
              .addField(config.prefix + "list", "Will print out a list of the twitter users you're currently getting pictures from.")

        message.channel.send({embed});
    }

    if (command === "pic") {
        if (args.length < 1)
            return message.channel.send("This command will get the latest tweet from the given user and post its picture.\nUsage: `" + config.prefix + "getpic <twitter screen name>`");
        var screenName = args[0];
        getLatestPic(message.channel, screenName);
    }

    if (command === "startget")
    {
        if (args.length < 1)
            return message.channel.send("This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + config.prefix + "startget <twitter screen name>`");
        var screenName = args[0];
        message.channel.send("I'm starting to get pictures from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
        // getLatestPic(message.channel, screenName);
        tClient.get('users/lookup', {'screen_name' : screenName})
            .then(function(data) {
                var userId = data[0].id_str;
                addGet(message.channel, userId);
                saveUsers();
            })
            .catch(function(error) {
                return message.channel.send("I can't find a user by the name of " + screenName);
            });
    }

    if (command === "stopget")
    {
        if (args.length < 1)
            return message.channel.send("This command will stop automatically fetching pictures from a twitter user\nUsage: `" + config.prefix + "stopget <twitter screen name>`");
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
});

dClient.on('ready', () => {
    loadUsers();
});

dClient.login(pw.dToken);
