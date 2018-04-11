var Twitter = require('twitter');
const Discord = require('discord.js');

var pw = require('./config.json');

var tClient = new Twitter({
    consumer_key: pw.tId,
    consumer_secret: pw.tSecret,
    access_token_key: pw.tToken,
    access_token_secret: pw.tTokenS
});

const dClient = new Discord.Client();

var channels = {};

function getLatestPic(channel, screenName) {
        tClient.get('statuses/user_timeline', {screen_name:screenName})
            .then(function(tweets){
                var tweet = tweets[0];
                if (!(tweet.hasOwnProperty('extended_entities') &&
                      tweet.extended_entities.hasOwnProperty('media') &&
                      tweet.extended_entities.media.length > 0))
                    return  channel.send("Sorry, the latest tweet from " + tweet.user.name + " doesn't have a picture! Here's what it says: `" + tweet.text + "`");
                var imgurl = tweet.extended_entities.media[0].media_url_https;
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

    if (message.content.indexOf(pw.prefix) !== 0)
    {
        if (message.channel.type == "dm")
            message.channel.send("Hello, I am A.I.kyan! Type " + pw.prefix+ "help to see a list of my commands! ❤");
        return ;
    }
    var args = message.content.slice(pw.prefix.length).trim().split(/ +/g);
    var command = args.shift().toLowerCase();

    if (command === "help" || command === "?")
    {
        const embed = new Discord.RichEmbed()
              .setColor(0xD667CF)
              .setTitle("A.I.kyan's Command List")
              .setDescription("This is all the things I can currently do:")
              .setFooter("Issues, suggestions? My creator is Tom'#4242")
              .addField(pw.prefix + "pic", "This command will get the latest tweet from the given user and post its picture.\nUsage: `" + pw.prefix + "pic <twitter screen name>`")
              .addField(pw.prefix + "startget", "This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + pw.prefix + "startget <twitter screen name> <time in minutes >= 15>`")
              .addField(pw.prefix + "stopget", "This command will stop automatically fetching pictures from a twitter user\nUsage: `" + pw.prefix + "stopget <twitter screen name>`")
              .addField(pw.prefix + "list", "Will print out a list of the twitter users you're currently getting pictures from.")

        message.channel.send({embed});
    }

    if (command === "pic") {
        if (args.length < 1)
            return message.channel.send("This command will get the latest tweet from the given user and post its picture.\nUsage: `" + pw.prefix + "getpic <twitter screen name>`");
        var screenName = args[0];
        getLatestPic(message.channel, screenName);
    }

    if (command === "startget")
    {
        if (args.length < 2)
            return message.channel.send("This command will periodically fetch a picture from a twitter user's last tweet\nUsage: `" + pw.prefix + "startget <twitter screen name> <time in minutes >= 15>`");
        var screenName = args[0];
        var delay = parseInt(args[1]);
        if (isNaN(delay))
            return message.channel.send("I'm sorry, I don't think " + args[1] + " is a number!");
        if (delay < 15)
        {
            if (!message.author.id === pw.ownerId)
                return message.channel.send("Sorry, the delay needs to be 15 minutes or over! Bots aren't allowed to go that fast :C");
            else message.channel.send("Overriding 15 minutes limit as " + message.author.username + " is my benevolent master");
        }
        message.channel.send("I'm starting to get pictures from " + screenName + ", remember you can stop me at any time with `" + pw.prefix + "stopget " + screenName + "` !");
        getLatestPic(message.channel, screenName);
        var interval = setInterval(getLatestPic, (delay * 1000 ) * 60, message.channel, screenName);
        if (!channels.hasOwnProperty(message.channel.id))
            channels[message.channel.id] = {};

        channels[message.channel.id][screenName] = {
            'intervalId' : interval,
            'delay' : delay,
        };
    }

    if (command === "stopget")
    {
        if (args.length < 1)
            return message.channel.send("This command will stop automatically fetching pictures from a twitter user\nUsage: `" + pw.prefix + "stopget <twitter screen name>`");
        var screenName = args[0];
        if (!channels.hasOwnProperty(message.channel.id))
            return message.channel.send("I'm afraid you don't have any oingoing `get`s! Use !!startget to do that");
        if (!(channels[message.channel.id].hasOwnProperty(screenName)))
            return message.channel.send("This user isn't being `get`ted right now. Use !!list to see whatI'm currently doing!");
        var intervalId = channels[message.channel.id][screenName].intervalId;
        clearInterval(intervalId);
        delete channels[message.channel.id][screenName];
        message.channel.send("It's gone!");
    }

    if (command === "list")
    {
        if (!(message.channel.id in channels))
            return message.channel.send("I'm afraid you don't have any oingoing `get`s! Use !!startget to do that");
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
    console.log('Ready!');
});

dClient.login(pw.dToken);
