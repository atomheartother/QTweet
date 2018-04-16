var userList = require('./userList.js');
var users = require('./users.js');
var tClient = require('./tClient.js');

function sendEmbed(channel, embed, react) {
    channel.send(embed)
        .then(function(message) {
            if (react)
                message.react("❤");
        })
        .catch(function(error){
            channel.send("I tried to respond but Discord won't let me! Did you give me permissions to send embed links?\nDiscord had this to say:\n`" + error.name + ": " + error.message + "`");
        });
}

function postTweet(channel, tweet) {
    let embed = {
        "author": {
            "name": tweet.user.name,
            "url": "https://twitter.com/" + tweet.user.screen_name,
            "icon_url": tweet.user.profile_image_url_https
        },
        "description": tweet.text,
    };
    if (userList.hasOwnProperty(tweet.user.id_str) &&
        !userList[tweet.user.id_str].hasOwnProperty('name')) {
        // if we don't have that user's name, add it to our list
        userList[tweet.user.id_str].name = tweet.user.screen_name;
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
