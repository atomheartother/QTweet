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

var channels = {};

function addGet(channel, screenName, delay) {
    var interval = setInterval(getLatestPic, (delay * 1000 ) * 60, channel, screenName);
    if (!channels.hasOwnProperty(channel.id))
        channels[channel.id] = {};

    channels[channel.id][screenName] = {
        'intervalId' : interval,
        'delay' : delay,
        'lastImg' : "",
    };
}

function saveChannels() {
    // Create a copy of the channels object, remove all timeouts from it
    var channelsCopy = Object.assign({}, channels);
    for (var id in channelsCopy) { // Iterate over channels
        if (!channelsCopy.hasOwnProperty(id)) continue;

        var channel = channelsCopy[id];
        for (var name in channel) { // Iterate over gets in channels
            if (!channel.hasOwnProperty(name)) continue;
            var get = channel[name];
            delete get.intervalId;
        }
    }
    var json = JSON.stringify(channelsCopy);
    fs.writeFile(config.getFile, json, 'utf8', function(err) {
        if (err !== null) {
            console.error("Error saving channels object:");
            console.error(err);
        }
    });
}

function getLatestPic(channel, screenName) {
        tClient.get('statuses/user_timeline', {screen_name:screenName})
            .then(function(tweets){
                var tweet = tweets[0];
                if (!(tweet.hasOwnProperty('extended_entities') &&
                      tweet.extended_entities.hasOwnProperty('media') &&
                      tweet.extended_entities.media.length > 0))
                    return  channel.send("Sorry, the latest tweet from " + tweet.user.name + " doesn't have a picture! Here's what it says:\n`" + tweet.text + "`");
                var imgurl = tweet.extended_entities.media[0].media_url_https;
                if (channels.hasOwnProperty(channel.id) &&
                    channels[channel.id].hasOwnProperty(screenName))
                {
                    // This is a recurrent call. If the previous image was the same as this one, no need to post
                    if (channels[channel.id][screenName].lastImg === imgurl)
                    {
                        console.log("Tried posting same image from " + screenName + " twice, ignored");
                        return;
                    }
                    channels[channel.id][screenName].lastImg = imgurl;
                }
                const embed = new Discord.RichEmbed()
                      .setAuthor(tweet.user.name, tweet.user.profile_image_url_https)
                      .setColor(0xD667CF)
                      .setFooter(tweet.text)
                      .setImage(tweet.extended_entities.media[0].media_url_https);
                channel.send({embed});
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
              .addField(config.prefix + "startget", "This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + config.prefix + "startget <twitter screen name> <time in minutes >= 15>`")
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
        if (args.length < 2)
            return message.channel.send("This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + config.prefix + "startget <twitter screen name> <time in minutes >= 15>`");
        var screenName = args[0];
        var delay = parseInt(args[1]);
        if (isNaN(delay))
            return message.channel.send("I'm sorry, I don't think " + args[1] + " is a number!");
        if (delay < 15)
        {
            if (!message.author.id === config.ownerId)
                return message.channel.send("Sorry, the delay needs to be 15 minutes or over! Bots aren't allowed to go that fast :C");
            else message.channel.send("Overriding 15 minutes limit as " + message.author.username + " is my benevolent master");
        }
        message.channel.send("I'm starting to get pictures from " + screenName + ", remember you can stop me at any time with `" + config.prefix + "stopget " + screenName + "` !");
        getLatestPic(message.channel, screenName);
        addGet(message.channel, screenName, delay);
        saveChannels();
    }

    if (command === "stopget")
    {
        if (args.length < 1)
            return message.channel.send("This command will stop automatically fetching pictures from a twitter user\nUsage: `" + config.prefix + "stopget <twitter screen name>`");
        var screenName = args[0];
        if (!channels.hasOwnProperty(message.channel.id))
            return message.channel.send("I'm afraid you don't have any oingoing `get`s! Use " + config.prefix + "startget to do that");
        if (!(channels[message.channel.id].hasOwnProperty(screenName)))
            return message.channel.send("This user isn't being `get`ted right now. Use " + config.prefix + "list to see what I'm currently doing!");
        var intervalId = channels[message.channel.id][screenName].intervalId;
        clearInterval(intervalId);
        delete channels[message.channel.id][screenName];
        if (Object.keys(channels[message.channel.id]).length === 0 &&
            channels[message.channel.id].constructor === Object)
            delete channels[message.channel.id];
        message.channel.send("It's gone!");
        saveChannels();
    }

    if (command === "list")
    {
        if (!(message.channel.id in channels))
            return message.channel.send("I'm afraid you don't have any oingoing `get`s! Use " + config.prefix + "startget to do that");
        var str = "We are currently getting the users:\n";
        for (var key in channels[message.channel.id])
        {

            // ignore prototype properties
            if (!channels[message.channel.id].hasOwnProperty(key))
                continue;
            str += key + " (Every " + channels[message.channel.id][key].delay + " minutes)\n";
        }
        message.channel.send(str);
    }
});

dClient.on('ready', () => {
    fs.stat(config.getFile, function(err, stat) {
        if (err == null) {
            console.log("Found a get file at " + config.getFile);
            fs.readFile(config.getFile, 'utf8', function(err, data) {
                if (err) {
                    console.error("There was a problem reading the config file");
                    return;
                }
                // Restore the channels object from saved file
                var channelsCopy = JSON.parse(data);
                // Re-create the thing at random intervals
                console.log(channelsCopy);
                for (var id in channelsCopy) { // Iterate over channels
                    if (!channelsCopy.hasOwnProperty(id)) continue;

                    var channel = channelsCopy[id];
                    for (var name in channel) { // Iterate over gets in channels
                        if (!channel.hasOwnProperty(name)) continue;

                        // Need a closure for this to save the loop variables' state
                        (function(channelId, screenName) {
                            // Acquire the get object
                            var get = channelsCopy[channelId][screenName];
                            // Get the channel object from channel id
                            var channel = dClient.channels.get(channelId);
                            // Immediately add the interval
                            addGet(channel, screenName, get.delay);
                            // Queue up a request immediately, on a random timer to avoid overloading APIs
                            setTimeout(function() {
                                getLatestPic(channel, screenName);
                            }, Math.floor((Math.random() * get.delay) * 1000 * 60));
                        })(id, name);
                    }
                }
            });
        }
    });
});

dClient.login(pw.dToken);
