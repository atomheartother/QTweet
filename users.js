var fs = require('fs');
var config = require('./config.json');

var dClient = require('./dClient.js');
var tClient = require('./tClient.js');
var post = require('./post.js');

// This is the stream variable, which handles receiving the twitter feed
var stream = null;

var users = require('./userList.js');

// Register the stream with twitter
function createStream() {
    if (stream != null)
        stream.destroy();
    stream = null;

    let userIds = [];
    // Get all the user IDs
    for (let id in users.list) {
        if (!users.list.hasOwnProperty(id)) continue;

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
        if (!users.list.hasOwnProperty(tweet.user.id_str)) {
            // Somehow we got a tweet from someone we don't follow anymore.
            console.error("We got a tweet from someone we don't follow:");
            console.error(tweet);
            return;
        }
        for (let get of users.list[tweet.user.id_str].channels) {
            post.tweet(get.channel, tweet);
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
                for (let userId in usersCopy) { // Iterate over users
                    if (!usersCopy.hasOwnProperty(userId)) continue;

                    let name = usersCopy[userId].hasOwnProperty('name') ? usersCopy[userId].name : null;
                    let channels = usersCopy[userId].channels;
                    for (let channelId of channels) { // Iterate over gets in channels
                        let channel = dClient.channels.get(channelId);
                        addGet(channel, userId, name);
                    }
                }
                // All users have been registered, we can request the stream from Twitter
                createStream();
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
                let channel = users[userId].channels[i].channel;
                if (channel.id == channel.id) {
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

module.exports = {
    list : users,

    showList : listUsers,

    save : saveUsers,

    load : loadUsers,

    add : addGet,

    rm : rmGet
};
