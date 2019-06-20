// Passwords file
const pw = require("../pw.json");
const post = require("./post");
const log = require("./log");
const users = require("./users");
const Backup = require("./backup");
const Stream = require("./twitterStream");

var Twitter = require("twitter-lite");

let twitter = (module.exports = {});

// Timeout detecting when there haven't been new tweets in the past min
let lastTweetTimeout = null;
const lastTweetDelay = 1000 * 60 * 10;

var tClient = new Twitter({
  consumer_key: pw.tId,
  consumer_secret: pw.tSecret,
  access_token_key: pw.tToken,
  access_token_secret: pw.tTokenS
});

const reconnectionDelay = new Backup({
  mode: "exponential",
  startValue: 2000,
  maxValue: 16000
});

const resetTimeout = () => {
  if (lastTweetTimeout) {
    clearTimeout(lastTweetTimeout);
    lastTweetTimeout = null;
  }
};

// Checks if a tweet has any media attached. If false, it's a text tweet
const hasMedia = ({ extended_entities, extended_tweet, retweeted_status }) =>
  (extended_entities &&
    extended_entities.hasOwnProperty("media") &&
    extended_entities.media.length > 0) ||
  (extended_tweet &&
    extended_tweet.extended_entities &&
    extended_tweet.extended_entities.media &&
    extended_tweet.extended_entities.media.length > 0) ||
  (retweeted_status &&
    retweeted_status.extended_entities &&
    retweeted_status.extended_entities.media &&
    retweeted_status.extended_entities.media.length > 0);

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

// Validation function for tweets
twitter.isValid = tweet =>
  !(
    !tweet || // Ignore null tweets
    !tweet.user || // Ignore tweets without authors
    (tweet.hasOwnProperty("in_reply_to_user_id") &&
      tweet.in_reply_to_user_id !== null)
  ); // Ignore replies // Ignore retweets

const formatTweetText = (text, entities) => {
  if (!entities) return text;
  const { user_mentions, urls, hashtags } = entities;
  const changes = [];

  if (user_mentions) {
    user_mentions
      .filter(
        ({ screen_name, indices }) =>
          screen_name && indices && indices.length === 2
      )
      .forEach(({ screen_name, name, indices }) => {
        const [start, end] = indices;
        changes.push({
          start,
          end,
          newText: `[@${
            name ? name : screen_name
          }](https://twitter.com/${screen_name})`
        });
      });
  }

  if (urls) {
    urls
      .filter(
        ({ expanded_url, indices }) =>
          expanded_url && indices && indices.length === 2
      )
      .forEach(({ expanded_url, indices }) => {
        const [start, end] = indices;
        changes.push({ start, end, newText: expanded_url });
      });
  }

  if (hashtags) {
    hashtags
      .filter(({ text, indices }) => text && indices && indices.length === 2)
      .forEach(({ text: hashtagTxt, indices }) => {
        const [start, end] = indices;
        changes.push({
          start,
          end,
          newText: `[#${hashtagTxt}](https://twitter.com/hashtag/${hashtagTxt}?src=hash)`
        });
      });
  }
  let offset = 0;

  let codePoints = [...text.normalize("NFC")];
  changes
    .sort((a, b) => a.start - b.start)
    .forEach(({ start, end, newText }) => {
      const nt = [...newText.normalize("NFC")];
      codePoints = codePoints
        .slice(0, start + offset)
        .concat(nt)
        .concat(g.slice(end + offset));
      offset += nt.length - (end - start);
    });

  return codePoints.join("");
};

// Takes a tweet and formats it for posting.
twitter.formatTweet = (tweet, callback) => {
  let {
    user,
    full_text,
    text,
    entities,
    extended_entities,
    extended_tweet,
    retweeted_status
  } = tweet;
  let txt = full_text || text;
  // Extended_tweet is an API twitter uses for tweets over 140 characters.
  if (extended_tweet) {
    ({ extended_entities, entities } = extended_tweet);
    txt = extended_tweet.full_text || extended_tweet.text;
  }
  if (retweeted_status) {
    // Copy over media from retweets
    extended_entities = extended_entities || retweeted_status.extended_entities;
  }
  let embed = {
    author: {
      name: `${user.name} (@${user.screen_name})`,
      url: "https://twitter.com/" + user.screen_name
    },
    thumbnail: {
      url: user.profile_image_url_https
    }
  };
  // For any additional files
  let files = null;
  if (
    users.collection.hasOwnProperty(user.id_str) &&
    (!users.collection[user.id_str].hasOwnProperty("name") ||
      users.collection[user.id_str].name !== user.screen_name)
  ) {
    // Add or update the username from that user
    users.collection[user.id_str].name = user.screen_name;
    users.save();
  }
  if (!hasMedia(tweet)) {
    // Text tweet
    embed.color = post.colors["text"];
  } else if (
    extended_entities.media[0].type === "animated_gif" ||
    extended_entities.media[0].type === "video"
  ) {
    // Gif/video.
    const vidinfo = extended_entities.media[0].video_info;
    let vidurl = null;
    let bitrate = null;
    for (let vid of vidinfo.variants) {
      // Find the best video
      if (vid.content_type === "video/mp4" && vid.bitrate < 1000000) {
        const paramIdx = vid.url.lastIndexOf("?");
        const hasParam = paramIdx !== -1 && paramIdx > vid.url.lastIndexOf("/");
        vidurl = hasParam ? vid.url.substring(0, paramIdx) : vid.url;
        bitrate = vid.bitrate;
      }
    }
    if (vidurl !== null) {
      if (vidinfo.duration_millis < 20000 || bitrate === 0) files = [vidurl];
      else {
        embed.image = { url: extended_entities.media[0].media_url_https };
        txt = `[Link to video](${vidurl})\n\n${txt}`;
      }
    } else {
      log("Found video tweet with no valid url");
      log(vidinfo);
    }
    embed.color = post.colors["video"];
  } else {
    // Image(s)
    files = extended_entities.media.map(media => media.media_url_https);
    if (files.length === 1) {
      embed.image = { url: files[0] };
      files = null;
      embed.color = post.colors["image"];
    } else {
      embed.color = post.colors["images"];
    }
  }
  embed.description = formatTweetText(txt, entities);
  callback({ embed, files });
};

const flagsFilter = (flags, tweet) => {
  if (flags.notext && !hasMedia(tweet)) {
    return false;
  }
  if (!flags.retweet && tweet.hasOwnProperty("retweeted_status")) {
    return false;
  }
  if (flags.noquote && tweet.is_quote_status) return false;
  return true;
};

const streamData = tweet => {
  // Ignore invalid tweets
  if (!twitter.isValid(tweet)) return;

  // Reset the last tweet timeout
  startTimeout();

  const twitterUserObject = users.collection[tweet.user.id_str];
  if (!twitterUserObject) {
    return;
  }
  twitter.formatTweet(tweet, embed => {
    twitterUserObject.subs.forEach(({ qChannel, flags }) => {
      if (flagsFilter(flags, tweet))
        post.embed(qChannel, embed, !tweet.is_quote_status);
    });
  });
  if (tweet.is_quote_status) {
    twitter.formatTweet(tweet.quoted_status, embed => {
      twitterUserObject.subs.forEach(({ qChannel, flags }) => {
        if (!flags.noquote) post.embed(qChannel, embed, true);
      });
    });
  }
};

const streamEnd = response => {
  // The backup exponential algorithm will take care of reconnecting
  stream.disconnected();
  resetTimeout();
  log(
    `: We got disconnected from twitter. Reconnecting in ${reconnectionDelay.value()}ms...`
  );
  setTimeout(twitter.createStream, reconnectionDelay.value());
  reconnectionDelay.increment();
};

const streamError = err => {
  // We simply can't get a stream, don't retry
  stream.disconnected();
  resetTimeout();
  log(`Error getting a stream (${err.status}: ${err.statusText})`);
  log(err);
};

// Stream object, holds the twitter feed we get posts from
let stream = new Stream(
  tClient,
  streamStart,
  streamData,
  streamError,
  streamEnd
);

// Register the stream with twitter, unregistering the previous stream if there was one
// Uses the users variable
twitter.createStream = async () => {
  let userIds = [];
  // Get all the user IDs
  for (let id in users.collection) {
    if (!users.collection.hasOwnProperty(id)) continue;

    userIds.push(id);
  }
  // If there are none, we can just leave stream at null
  if (userIds.length < 1) return;
  stream.create(userIds);
};

twitter.userLookup = params => {
  return tClient.get("users/lookup", params);
};

twitter.userTimeline = params => {
  return tClient.get("statuses/user_timeline", params);
};

twitter.showTweet = (id, params) => {
  return tClient.get(`statuses/show/${id}`, params);
};
