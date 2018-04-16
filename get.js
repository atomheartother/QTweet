var config = require('./config.json');

var users = require('./users.js')
var tClient = require('./tClient.js');

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
            console.log(users);
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
