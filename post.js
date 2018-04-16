var userList = require('./userList.js');
var users = require('./users.js');
var tClient = require('./tClient.js');
var get = require('./tClient.js');

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
        console.log("Saved users:");
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
                console.log("\nGets file data is:");
                console.log(usersCopy);
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
                        addUser(channel, userId, name);
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

function sendEmbed(channel, embed, react) {
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
        users.save();
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
    sendEmbed(channel, {embed}, true);
}


module.exports = {
    tweet : postTweet,
    embed : sendEmbed,
}
