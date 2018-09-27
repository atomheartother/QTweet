var post = module.exports = {};

let users = require('./users');

// text: Boolean. Don't post text tweets if false
post.tweet = (channel, tweet, text) => {
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
    if (users.collection.hasOwnProperty(tweet.user.id_str) &&
        !users.collection[tweet.user.id_str].hasOwnProperty('name')) {
        // if we don't have that user's name, add it to our list
        users.collection[tweet.user.id_str].name = tweet.user.screen_name;
        users.save();
    }
    if (!(tweet.hasOwnProperty('extended_entities') &&
          tweet.extended_entities.hasOwnProperty('media') &&
          tweet.extended_entities.media.length > 0)) {
        // Text tweet
        if (!text) { // We were told not to post text tweets to this channel
            return;
        }
        embed.color = 0x69B2D6;
    }
    else if (tweet.extended_entities.media[0].type === "animated_gif" ||
             tweet.extended_entities.media[0].type === "video") {
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
    else {
        // Image
        let imgurl = tweet.extended_entities.media[0].media_url_https;
        embed.color = 0xD667CF;
        embed.image = { "url": imgurl };
    }
    console.log(channel.id + ": Sending embed");
    post.embed(channel, {embed}, true);
}
// React is a boolean, if true, add a reaction to the message after posting
post.embed = (channel, embed, react) => {
    channel.send(embed)
        .then(function(message) {
            if (react)
                message.react("❤")
                .catch((err)=> {
                    console.error(new Date() + ": Reacting to message in channel " + channel.name + " failed!");
                    console.error(err);
                });
        })
        .catch(function(error){
            console.log(new Date() + ": Tried to post an embed to " + channel.id + ", but it failed. We'll try to warn the user. If it fails it'll be reported in the error log.");
            console.log(error);
            post.message(channel, "I tried to respond but Discord won't let me! Did you give me permissions to send embed links?\nDiscord had this to say:\n`" + error.name + ": " + error.message + "`");
        });
}

post.message = (channel, message) => {
    channel.send(message)
        .catch(function(error) {
            console.error(new Date() + ": Sending message to channel " + channel.id + " failed: " + message);
            console.error(error);
            // Try to contact the guild owner
            channel.guild.owner.send("Hello, I just tried sending a message to your channel '" + channel.name + "', but I couldn't. Did you give me the proper rights?")
            .catch(function(err) {
                console.error(new Date() + ": Sending message to guild owner " + channel.guild.owner.tag + " failed too!");
                console.error(err);
            });
        });
}
