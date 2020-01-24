import Twitter from 'twitter-lite';

import unfurl from 'unfurl.js';
import { isSet } from './flags';
import { getUserIds, getUserSubs, updateUser } from './subs';
import Backup from './backup';
import log from './log';

import { embed as postEmbed, message as postMessage } from './post';
import Stream from './twitterStream';
import QChannel from './QChannel';

// Stream object, holds the twitter feed we get posts from, initialized at the first
let stream = null;

const colors = Object.freeze({
  text: 0x69b2d6,
  video: 0x67d67d,
  image: 0xd667cf,
  images: 0x53a38d,
});

const tClient = new Twitter({
  consumer_key: process.env.TWITTER_ID,
  consumer_secret: process.env.TWITTER_SECRET,
  access_token_key: process.env.TWITTER_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
});

const reconnectionDelay = new Backup({
  mode: 'exponential',
  startValue: 2000,
  maxValue: 16000,
});

// Checks if a tweet has any media attached. If false, it's a text tweet
const hasMedia = ({
  extended_entities: extendedEntities,
  extended_tweet: extendedTweet,
  retweeted_status: retweetedStatus,
}) => (extendedEntities
    && extendedEntities.media
    && extendedEntities.media.length > 0)
  || (extendedTweet
    && extendedTweet.extended_entities
    && extendedTweet.extended_entities.media
    && extendedTweet.extended_entities.media.length > 0)
  || (retweetedStatus
    && retweetedStatus.extended_entities
    && retweetedStatus.extended_entities.media
    && retweetedStatus.extended_entities.media.length > 0);

const streamStart = () => {
  log('Stream successfully started');
  reconnectionDelay.reset();
};

// Validation function for tweets
export const isValid = (tweet) => !(
  !tweet
    || !tweet.user
    || (tweet.is_quote_status
      && (!tweet.quoted_status || !tweet.quoted_status.user))
);

const unfurlUrl = async (url) => {
  const { expanded_url: expandedUrl, indices } = url;
  if (!(expandedUrl && indices && indices.length === 2)) return null;
  try {
    const unfurledUrl = await unfurl(expandedUrl);
    return { unfurledUrl, expandedUrl, indices };
  } catch (e) {
    return { unfurledUrl: null, expandedUrl, indices };
  }
};

const formatTweetText = async (text, entities, isTextTweet) => {
  if (!entities) return text;
  const { user_mentions: userMentions, urls, hashtags } = entities;
  const changes = [];
  const metadata = {};
  let offset = 0;
  // Remove all the @s at the start of the tweet to make it shorter
  let inReplies = true;
  let replyIndex = 0;
  if (userMentions) {
    userMentions
      .filter(
        ({ screen_name: screenName, indices }) => screenName && indices && indices.length === 2,
      )
      .forEach(({ screen_name: screenName, name, indices }) => {
        const [start, end] = indices;
        if (inReplies && start === replyIndex) {
          changes.push({ start, end: end + 1, newText: '' });
          replyIndex = end + 1;
        } else {
          inReplies = false;
          changes.push({
            start,
            end,
            newText: `[@${
              name || screenName
            }](https://twitter.com/${screenName})`,
          });
        }
      });
  }
  let bestPreview = null;
  if (urls) {
    const unfurledLinks = await Promise.all(urls.map(unfurlUrl));
    for (let i = unfurledLinks.length - 1; i >= 0; i -= 1) {
      if (unfurledLinks[i] !== null) {
        const {
          expandedUrl, indices,
        } = unfurledLinks[i];
        if (isTextTweet && !bestPreview && unfurledLinks[i].unfurledUrl !== null) {
          const {
            unfurledUrl: {
              open_graph: openGraph,
              twitter_card: twitterCard,
            },
          } = unfurledLinks[i];
          bestPreview = (twitterCard
              && twitterCard.images
              && twitterCard.images[0]
              && twitterCard.images[0].url)
            || (openGraph
              && openGraph.images
              && openGraph.images[0]
              && openGraph.images[0].url)
            || bestPreview;
          if (bestPreview && bestPreview.startsWith('//')) {
            bestPreview = `https:${bestPreview}`;
          } else if (bestPreview && !bestPreview.startsWith('http')) {
            bestPreview = null;
          }
        }
        const [start, end] = indices;
        changes.push({ start, end, newText: expandedUrl });
      }
    }
  }
  if (bestPreview) {
    metadata.preview = bestPreview;
  }
  if (hashtags) {
    hashtags
      .filter(({ text: hashtagTxt, indices }) => hashtagTxt && indices && indices.length === 2)
      .forEach(({ text: hashtagTxt, indices }) => {
        const [start, end] = indices;
        changes.push({
          start,
          end,
          newText: `[#${hashtagTxt}](https://twitter.com/hashtag/${hashtagTxt}?src=hash)`,
        });
        if (hashtagTxt.toLowerCase() === 'qtweet') {
          metadata.ping = true;
        }
      });
  }

  let codePoints = [...text.normalize('NFC')];
  changes
    .sort((a, b) => a.start - b.start)
    .forEach(({ start, end, newText }) => {
      const nt = [...newText.normalize('NFC')];
      codePoints = codePoints
        .slice(0, start + offset)
        .concat(nt)
        .concat(codePoints.slice(end + offset));
      offset += nt.length - (end - start);
    });
  let fixedText = codePoints
    .join('')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<');
  const linkIdx = fixedText.indexOf('https://t.co/');
  if (linkIdx > -1) {
    fixedText = fixedText.substring(0, linkIdx);
  }
  return {
    text: fixedText,
    metadata,
  };
};

// Takes a tweet and formats it for posting.
export const formatTweet = async (tweet, isQuoted) => {
  const {
    user,
    full_text: fullText,
    text,
    extended_tweet: extendedTweet,
    retweeted_status: retweetedStatus,
  } = tweet;
  let {
    id_str: idStr,
    extended_entities: extendedEntities,
    entities,
  } = tweet;
  let txt = fullText || text;
  // Extended_tweet is an API twitter uses for tweets over 140 characters.
  if (extendedTweet) {
    ({ extended_entities: extendedEntities, entities } = extendedTweet);
    txt = extendedTweet.full_text || extendedTweet.text;
  }
  let targetScreenName = user.screen_name;
  if (retweetedStatus) {
    // Copy over media from retweets
    extendedEntities = extendedEntities || retweetedStatus.extended_entities;
    // Use the id_str if there's one
    idStr = retweetedStatus.id_str || idStr;
    targetScreenName = retweetedStatus.user.screen_name || targetScreenName;
  }
  const embed = {
    author: {
      name: `${isQuoted ? '[QUOTED] ' : ''}${user.name} (@${user.screen_name})`,
      url: `https://twitter.com/${targetScreenName}/status/${idStr}`,
    },
    thumbnail: {
      url: user.profile_image_url_https,
    },
    color: user.profile_link_color
      ? parseInt(user.profile_link_color, 16)
      : null,
  };
  // For any additional files
  let files = null;
  const isTextTweet = !hasMedia(tweet);
  const { text: formattedText, metadata } = await formatTweetText(
    txt,
    entities,
    isTextTweet,
  );
  txt = formattedText;
  if (isTextTweet) {
    // Text tweet
    if (metadata.preview) {
      embed.image = { url: metadata.preview };
    }
    embed.color = embed.color || colors.text;
  } else if (
    extendedEntities.media[0].type === 'animated_gif'
    || extendedEntities.media[0].type === 'video'
  ) {
    // Gif/video.
    const vidinfo = extendedEntities.media[0].video_info;
    let vidurl = null;
    let bitrate = null;
    for (let i = 0; i < vidinfo.variants.length; i += 1) {
      const vid = vidinfo.variants[i];
      // Find the best video
      if (vid.content_type === 'video/mp4' && vid.bitrate < 1000000) {
        const paramIdx = vid.url.lastIndexOf('?');
        const hasParam = paramIdx !== -1 && paramIdx > vid.url.lastIndexOf('/');
        vidurl = hasParam ? vid.url.substring(0, paramIdx) : vid.url;
        bitrate = vid.bitrate;
      }
    }
    if (vidurl !== null) {
      if (vidinfo.duration_millis < 20000 || bitrate === 0) files = [vidurl];
      else {
        embed.image = { url: extendedEntities.media[0].media_url_https };
        txt = `${txt}\n[Link to video](${vidurl})`;
      }
    } else {
      log('Found video tweet with no valid url');
      log(vidinfo);
    }
    embed.color = embed.color || colors.video;
  } else {
    // Image(s)
    files = extendedEntities.media.map((media) => media.media_url_https);
    if (files.length === 1) {
      embed.image = { url: files[0] };
      files = null;
    }
    embed.color = embed.color || colors.image;
  }
  embed.description = txt;
  return { embed: { embed, files }, metadata };
};

// Takes a tweet and determines whether or not it should be posted with these flags
const flagsFilter = (flags, tweet) => {
  if (isSet(flags, 'notext') && !hasMedia(tweet)) {
    return false;
  }
  if (!isSet(flags, 'retweet') && tweet.retweeted_status) {
    return false;
  }
  if (isSet(flags, 'noquote') && tweet.is_quote_status) return false;
  return true;
};

export const getFilteredSubs = async (tweet) => {
  // Ignore invalid tweets
  if (!isValid(tweet)) return [];
  // Ignore tweets from people we don't follow
  // and replies unless they're replies to oneself (threads)
  const subs = await getUserSubs(tweet.user.id_str);
  if (
    !subs
    || subs.length === 0
    || (tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== tweet.user.id)
  ) return [];

  const targetSubs = [];
  for (let i = 0; i < subs.length; i += 1) {
    const { flags, channelId, isDM } = subs[i];
    if (flagsFilter(flags, tweet)) {
      const qChannel = QChannel.unserialize({ channelId, isDM });
      targetSubs.push({ flags, qChannel });
    }
  }
  return targetSubs;
};

const streamData = async (tweet) => {
  const subs = await getFilteredSubs(tweet);
  if (subs.length === 0) return;
  const { embed, metadata } = await formatTweet(tweet);
  subs.forEach(({ flags, qChannel }) => {
    if (metadata.ping && flags.ping) {
      log('Pinging @everyone', qChannel);
      postMessage(qChannel, '@everyone');
    }
    postEmbed(qChannel, embed);
  });
  if (tweet.is_quote_status) {
    const { embed: quotedEmbed } = await formatTweet(tweet.quoted_status, true);
    subs.forEach(({ flags, qChannel }) => {
      if (!flags.noquote) postEmbed(qChannel, quotedEmbed);
    });
  }
  updateUser(tweet.user);
};

const streamEnd = () => {
  // The backup exponential algorithm will take care of reconnecting
  stream.disconnected();
  log(
    `: We got disconnected from twitter. Reconnecting in ${reconnectionDelay.value()}ms...`,
  );
  // eslint-disable-next-line no-use-before-define
  setTimeout(createStream, reconnectionDelay.value());
  reconnectionDelay.increment();
};

const streamError = ({ url, status, statusText }) => {
  // We simply can't get a stream, don't retry
  stream.disconnected();
  let delay = 0;
  if (status === 420) {
    delay = 30000;
  } else {
    delay = reconnectionDelay.value();
    reconnectionDelay.increment();
  }
  log(
    `Twitter Error (${status}: ${statusText}) at ${url}. Reconnecting in ${delay}ms`,
  );
  // eslint-disable-next-line no-use-before-define
  setTimeout(createStream, delay);
};

export const getError = (response) => {
  if (!response || !response.errors || response.errors.length < 1) return { code: null, msg: null };
  return response.errors[0];
};

// Register the stream with twitter, unregistering the previous stream if there was one
// Uses the users variable
export const createStream = async () => {
  if (!stream) {
    stream = new Stream(
      tClient,
      streamStart,
      streamData,
      streamError,
      streamEnd,
    );
  }
  // Get all the user IDs
  const userIds = await getUserIds();
  // If there are none, we can just leave stream at null
  if (!userIds || userIds.length < 1) return;
  stream.create(userIds.map(({ twitterId }) => twitterId));
};

export const destroyStream = () => {
  stream.disconnected();
};

export const userLookup = (params) => tClient.post('users/lookup', params);

export const userTimeline = (params) => tClient.get('statuses/user_timeline', params);

export const showTweet = (id, params) => tClient.get(`statuses/show/${id}`, params);
