let twitter = (module.exports = {});

// Passwords file
var pw = require("./pw.json");
let post = require("./post");

var Twitter = require("twitter");
var tClient = new Twitter({
  consumer_key: pw.tId,
  consumer_secret: pw.tSecret,
  access_token_key: pw.tToken,
  access_token_secret: pw.tTokenS
});

let users = require("./users");

// Stream object, holds the twitter feed we get posts from
twitter.stream = null;

// Register the stream with twitter, unregistering the previous stream if there was one
// Uses the users variable
twitter.createStream = () => {
  if (twitter.stream != null) twitter.stream.destroy();
  twitter.stream = null;

  let userIds = [];
  // Get all the user IDs
  for (let id in users.collection) {
    if (!users.collection.hasOwnProperty(id)) continue;

    userIds.push(id);
  }
  // If there are none, we can just leave stream at null
  if (userIds.length < 1) return;

  console.log("A stream is being created, registering users:");
  console.log(userIds);
  // Else, register the stream using our userIds
  twitter.stream = tClient.stream("statuses/filter", {
    follow: userIds.toString()
  });

  twitter.stream.on("data", function(tweet) {
    if (
      (tweet.hasOwnProperty("in_reply_to_user_id") &&
        tweet.in_reply_to_user_id !== null) ||
      tweet.hasOwnProperty("retweeted_status")
    ) {
      // This is a reply or a retweet, ignore it
      return;
    }
    if (!users.collection.hasOwnProperty(tweet.user.id_str)) {
      return;
    }
    let channelsLen = users.collection[tweet.user.id_str].channels.length;
    for (let i = 0; i < channelsLen; i++) {
      let get = users.collection[tweet.user.id_str].channels[i];
      post.tweet(get.channel, tweet, get.text);
    }
  });

  twitter.stream.on("error", function(err) {
    console.error(new Date() + ": Error getting a stream:");
  });

  twitter.stream.on("end", function(response) {
    console.error(
      new Date() + ": We got disconnected from twitter. Reconnecting in 5min..."
    );
    setTimeout(twitter.createStream, 5 * 1000 * 50);
  });
};

twitter.userLookup = params => {
  return tClient.get("users/lookup", params);
};

twitter.userTimeline = params => {
  return tClient.get("statuses/user_timeline", params);
};
