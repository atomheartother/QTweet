let twitter = (module.exports = {});

// Passwords file
const pw = require("./pw.json");
const post = require("./post");
const log = require("./log");
const users = require("./users");

// Reconnection time in ms
// Will be multiplied by 2 everytime we fail
let reconnectDelay = 250;

// Timeout detecting when there haven't been new tweets in the past 5min
let lastTweetTimeout = null;
const lastTweetDelay = 1000 * 60 * 5;

var Twitter = require("twitter-lite");

var tClient = new Twitter({
  consumer_key: pw.tId,
  consumer_secret: pw.tSecret,
  access_token_key: pw.tToken,
  access_token_secret: pw.tTokenS
});

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
  log(`Creating a stream with ${userIds.length} registered users`);
  // Else, register the stream using our userIds
  twitter.stream = tClient.stream("statuses/filter", {
    follow: userIds.toString()
  });

  twitter.stream.on("start", response => {
    log("Stream successfully started");
    lastTweetTimeout = setTimeout(() => {
      lastTweetTimeout = null;
      log("⚠️ TIMEOUT: No tweets in a while, re-creating stream");
      twitter.createStream();
    }, lastTweetDelay);
  });

  twitter.stream.on("data", function(tweet) {
    // Reset the reconn delay
    if (reconnectDelay > 250) reconnectDelay = 250;
    // Reset the last tweet timeout
    if (!tweet.user) {
      if (!tweet.delete) {
        log("Got tweet without username");
        log(tweet);
      } else {
        log("Got delete tweet");
      }
      return;
    }
    log(`Got tweet from ${tweet.user.screen_name}`);
    if (lastTweetTimeout) {
      clearTimeout(lastTweetTimeout);
    }
    lastTweetTimeout = setTimeout(() => {
      lastTweetTimeout = null;
      log("⚠️ TIMEOUT: No tweets in a while, re-creating stream");
      twitter.createStream();
    }, lastTweetDelay);
    if (
      (tweet.hasOwnProperty("in_reply_to_user_id") &&
        tweet.in_reply_to_user_id !== null) ||
      tweet.hasOwnProperty("retweeted_status")
    ) {
      return;
    }
    const twitterUserObject = users.collection[tweet.user.id_str];
    if (!twitterUserObject) {
      log(`Got a tweet from someone we don't follow: ${tweet.user.id_str}`);
      return;
    }
    if (twitterUserObject.channels.length === 1) {
      log(
        `<- ${twitterUserObject.name}`,
        twitterUserObject.channels[0].channel
      );
    } else {
      log(
        `Posting tweet from ${twitterUserObject.name} to ${
          twitterUserObject.channels.length
        } channels`
      );
    }
    twitterUserObject.channels.forEach(get => {
      post.tweet(get.channel, tweet, get.text);
    });
  });

  twitter.stream.on("error", function(err) {
    if (lastTweetTimeout) clearTimeout(lastTweetTimeout);
    log(`Error getting a stream: ${err}`);
  });

  twitter.stream.on("end", function(response) {
    if (lastTweetTimeout) clearTimeout(lastTweetTimeout);
    log(
      `: We got disconnected from twitter (${response}). Reconnecting in ${reconnectDelay}ms...`
    );
    setTimeout(twitter.createStream, reconnectDelay);
    reconnectDelay *= 2;
  });
};

twitter.userLookup = params => {
  return tClient.get("users/lookup", params);
};

twitter.userTimeline = params => {
  return tClient.get("statuses/user_timeline", params);
};
