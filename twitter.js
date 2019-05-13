let twitter = (module.exports = {});

// Passwords file
const pw = require("./pw.json");
const post = require("./post");
const log = require("./log");
const users = require("./users");
const Backup = require("./backup");

var Twitter = require("twitter-lite");

// Timeout detecting when there haven't been new tweets in the past min
let lastTweetTimeout = null;
const lastTweetDelay = 1000 * 60;

var tClient = new Twitter({
  consumer_key: pw.tId,
  consumer_secret: pw.tSecret,
  access_token_key: pw.tToken,
  access_token_secret: pw.tTokenS
});

// Stream object, holds the twitter feed we get posts from
let stream = null;

const reconnectionDelay = new Backup({
  mode: "linear",
  increment: 250,
  maxValue: 16000
});

const resetTimeout = () => {
  if (lastTweetTimeout) {
    clearTimeout(lastTweetTimeout);
    lastTweetTimeout = null;
  }
};

const startTimeout = () => {
  resetTimeout();
  lastTweetTimeout = setTimeout(() => {
    lastTweetTimeout = null;
    log("⚠️ TIMEOUT: No tweets in a while, re-creating stream");
    twitter.createStream();
  }, lastTweetDelay);
};

const streamStart = response => {
  log("Stream successfully started");
  reconnectionDelay.reset();
  startTimeout();
};

const streamData = tweet => {
  // Reset the last tweet timeout
  startTimeout();

  // Ignore deletion notifications and null values, which we get somehow
  if (!tweet || !tweet.user) {
    if (!tweet) {
      log(`Got null tweet: ${tweet}`);
    } else if (!tweet.delete) {
      log("Got tweet without username");
      log(tweet);
    }
    return;
  }
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
    log(`<- ${twitterUserObject.name}`, twitterUserObject.channels[0].channel);
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
};

const streamEnd = response => {
  // The backup exponential algorithm will take care of reconnecting
  resetTimeout();
  log(response);
  log(
    `: We got disconnected from twitter. Reconnecting in ${reconnectionDelay.value()}ms...`
  );
  setTimeout(twitter.createStream, reconnectionDelay.value());
  reconnectionDelay.increment();
};

const streamError = err => {
  // We simply can't get a stream, don't retry
  resetTimeout();
  log(`Error getting a stream`);
  log(err);
};

// Register the stream with twitter, unregistering the previous stream if there was one
// Uses the users variable
twitter.createStream = () => {
  if (stream !== null) stream.destroy();
  stream = null;

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
  // Give it a bit so twitter understands the stream was destroyed
  setTimeout(() => {
    if (stream !== null) {
      // Another stream was created in the meantime, wait a while and re-register this one so we know for sure everything is fine
      log(
        "A second stream was created while we were waiting, queueing a new stream in 5s"
      );
      setTimeout(twitter.createStream, 5000);
      return;
    }
    stream = tClient
      .stream("statuses/filter", {
        follow: userIds.toString()
      })
      .on("start", streamStart)
      .on("data", streamData)
      .on("error", streamError)
      .on("end", streamEnd);
  }, 250);
};

twitter.userLookup = params => {
  return tClient.get("users/lookup", params);
};

twitter.userTimeline = params => {
  return tClient.get("statuses/user_timeline", params);
};
