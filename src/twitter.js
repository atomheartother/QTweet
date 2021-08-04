import Twitter from 'twitter-lite';
import { Status as Tweet } from 'twitter-d';
import unfurl from 'unfurl.js';
import { isSet } from './flags';
import Backup from './backup';
import log from './log';

import { post, someoneHasChannel } from './shardMgr/shardManager';
import Stream from './twitterStream';
import {
  updateUser,
  getUserIds,
  getUsersForSanityCheck,
  bulkDeleteUsers,
} from './db/user';
import {
  getUserSubs,
} from './db/subs';
import {
  getChannels,
  rmChannel,
} from './db/channels';
import {
  sanityCheck as dbSanityCheck,
} from './db';

// Stream object, holds the twitter feed we get posts from, initialized at the first
let stream = null;
let twitterTimeout = null;
const twitterTimeoutDelay = Number(process.env.TWEETS_TIMEOUT);

const colors = Object.freeze({
  text: 0x69b2d6,
  video: 0x67d67d,
  image: 0xd667cf,
  images: 0x53a38d,
});

const tClient = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET_KEY,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const DISABLE_STREAMS = !!Number(process.env.DISABLE_STREAMS);

const reconnectionDelay = new Backup({
  mode: 'exponential',
  startValue: 2 * 1000,
  maxValue: Number(process.env.TWITTER_MAX_RECONNECT_DELAY) || 240000,
});

let reconnectionTimeoutID = null;

export const destroyStream = () => {
  if (stream) { stream.disconnected(); }
};

function resetTwitterTimeout() {
  if (twitterTimeoutDelay <= 0) return;
  if (twitterTimeout !== null) {
    clearTimeout(twitterTimeout);
  }
  twitterTimeout = setTimeout(() => {
    twitterTimeout = null;
    log(`❌ ${twitterTimeoutDelay}s without tweets, resetting stream...`);
    if (reconnectionTimeoutID) {
      log('❌ We\'re already in reconnection mode, abort timeout system');
      return;
    }
    destroyStream();
    // eslint-disable-next-line no-use-before-define
    setTimeout(createStream, 30000);
  }, twitterTimeoutDelay * 1000);
}

// Checks if a tweet has any media attached. If false, it's a text tweet
export const hasMedia = ({
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

// Validation function for tweets
export const isValid = (tweet) => !(
  // Ignore undefined or null tweets
  !tweet
    // Ignore tweets without a user object
    || !tweet.user
    // Ignore tweets where there is a quote status and not a quoted_status or a user for it.
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

const bestPicture = (twitterCard, openGraph) => {
  let images = (twitterCard && twitterCard.images) || [];
  if (openGraph && openGraph.images) {
    images = images.concat(openGraph.images);
  }
  images = images.filter(({ url }) => {
    if (!url) return false; // Ignore invalid images
    if (!url.startsWith('http') && !url.startsWith('//')) return false; // Ignore URLS that aren't valid
    const idx = url.indexOf('.');
    return (idx > -1 && idx < url.length - 1); // Ignore if there's no dot
  });
  if (images.length < 1) return null;
  const bestImg = images[0].url;
  return bestImg.startsWith('//') ? `https:${bestImg}` : bestImg;
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
          bestPreview = bestPicture(twitterCard, openGraph);
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
  let authorName = `${user.name} (@${user.screen_name})`;
  if (isQuoted) {
    authorName = `[QUOTED] ${authorName}`;
  } else if (tweet.in_reply_to_screen_name) {
    authorName = `${authorName} [REPLY TO @${tweet.in_reply_to_screen_name}]`;
  }
  const embed = {
    url: `https://twitter.com/${targetScreenName}/status/${idStr}`,
    author: {
      name: authorName,
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
  if (!isSet(flags, 'replies') && tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== tweet.user.id) return false;
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
  ) return [];

  const targetSubs = [];
  for (let i = 0; i < subs.length; i += 1) {
    const {
      flags, channelId, isDM, msg,
    } = subs[i];
    if (isDM) log(`Should we post ${tweet.id_str} in channel ${channelId}?`, null, true);
    if (flagsFilter(flags, tweet)) {
      if (isDM) log(`Added (${channelId}, ${isDM}) to targetSubs.`, null, true);
      targetSubs.push({ flags, qChannel: { channelId, isDM }, msg });
    }
  }
  return targetSubs;
};

// Called on stream connection
// Reset our reconnection delay
const streamStart = () => {
  log('✅ Stream successfully started');
  if (twitterTimeoutDelay > 0) {
    log(`Will reconnect if inactive for ${twitterTimeoutDelay}s`);
  }
  resetTwitterTimeout();
  reconnectionDelay.reset();
};

// Called when we receive data
const streamData = async (tweet) => {
  resetTwitterTimeout();
  const subs = await getFilteredSubs(tweet);
  if (subs.length === 0) {
    log('✅ Discarded a tweet', null, true);
    return;
  }
  log(`✅ Received valid tweet: ${tweet.id_str}, forwarding to ${subs.length} Discord subscriptions`, null, true);
  const { embed, metadata } = await formatTweet(tweet);
  subs.forEach(({ flags, qChannel, msg }) => {
    if (metadata.ping && isSet(flags, 'ping')) {
      post(qChannel, '@everyone', 'message');
    }
    if (msg) {
      post(qChannel, msg, 'message');
    }
    post(qChannel, embed, 'embed');
  });
  if (tweet.is_quote_status) {
    const { embed: quotedEmbed } = await formatTweet(tweet.quoted_status, true);
    subs.forEach(({ flags, qChannel }) => {
      if (!flags.noquote) {
        post(qChannel, quotedEmbed, 'embed');
      }
    });
  }
  updateUser(tweet.user);
};

// Called when twitter ends the connection
const streamEnd = () => {
  // The backup exponential algorithm will take care of reconnecting
  destroyStream();
  log(
    `❌ We got disconnected from twitter. Reconnecting in ${reconnectionDelay.value()}ms...`,
  );
  if (reconnectionTimeoutID) {
    clearTimeout(reconnectionTimeoutID);
  }
  // eslint-disable-next-line no-use-before-define
  reconnectionTimeoutID = setTimeout(createStreamClearTimeout, reconnectionDelay.value());
  reconnectionDelay.increment();
};

// Called when the stream has an error
const streamError = ({ url, status, statusText }) => {
  if (status === 420 && reconnectionDelay.value() < 60000) {
    log('⚙️ 420 status code detected, jumping to 1min delay immediately', null, true);
    // If we're being rate-limited, wait 1min at least, up to max
    reconnectionDelay.set(60000);
  }
  // We simply can't get a stream, don't retry
  stream.disconnected(false);
  const delay = reconnectionDelay.value();
  if (reconnectionTimeoutID) {
    clearTimeout(reconnectionTimeoutID);
  } else {
    reconnectionDelay.increment();
  }
  log(
    `❌ Twitter Error (${status}: ${statusText}) at ${url}. Reconnecting in ${delay}ms`,
  );
  // eslint-disable-next-line no-use-before-define
  reconnectionTimeoutID = setTimeout(createStreamClearTimeout, delay);
};

export const getError = (response) => {
  if (!response || !response.errors || response.errors.length < 1) return { code: null, msg: null };
  return response.errors[0];
};

// Register the stream with twitter, unregistering the previous stream if there was one
// Uses the users variable
export const createStream = async () => {
  if (reconnectionTimeoutID) {
    log('Got a new stream request but we\'re already waiting for a reconnection...');
    return null;
  }
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
  if (!userIds || userIds.length < 1) {
    log('No user IDs, no need to create a stream...');
    return null;
  }
  if (!DISABLE_STREAMS) {
    stream.create(userIds.map(({ twitterId }) => twitterId));
  } else {
    log('ATTENTION: the DISABLE_STREAMS variable is set, meaning streams are currently not being created!');
  }
  return null;
};

const createStreamClearTimeout = () => {
  reconnectionTimeoutID = null;
  createStream();
};

export const userLookup = (params) => tClient.post('users/lookup', params);

export const userTimeline = (params) => tClient.get('statuses/user_timeline', params);

export const showTweet = (id) => tClient.get(`statuses/show/${id}`, { tweet_mode: 'extended' });

// Small helper function to timeout in async
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

export const usersSanityCheck = async (limit, cursor, timeout) => {
  log(`⚙️ User sanity check: Checking users ${cursor * limit} to ${cursor * limit + limit}`);
  const ids = (await getUsersForSanityCheck(limit, cursor)).map(({ twitterId }) => twitterId);
  if (ids.length < 1) return 0;
  // deleted is an array of booleans. True means the account was deleted
  const deleted = await Promise.all(ids.map((id) => new Promise((resolve) => {
    userLookup({ user_id: id }).then(() => {
      resolve(false);
    }).catch(() => {
      resolve(true);
    });
  })));
  const idsToDelete = ids.filter((id, idx) => deleted[idx]);
  try {
    const deletedUsers = idsToDelete.length > 0 ? await bulkDeleteUsers(idsToDelete) : 0;
    log(`⚙️ User sanity check: ${cursor * limit} -> ${cursor * limit + limit}, removed ${deletedUsers} invalid users`);
    if (ids.length < limit) return deletedUsers;
    await sleep(timeout);
    return deletedUsers + await usersSanityCheck(limit, cursor + 1, timeout);
  } catch (e) {
    console.error('Error during bulk deletion, sanity check aborted');
    console.error(e);
  }
  return 0;
};

// Makes sure everything is consistent
export const sanityCheck = async () => {
  const allChannels = await getChannels();
  log(`⚙️ Starting sanity check on ${allChannels.length} channels`);
  const areChannelsValid = await Promise.all(allChannels.map(
    (c) => someoneHasChannel(c).then((res) => ({ c, res })),
  ));
  const deletedChannels = await Promise.all(areChannelsValid.map(({ c, res }) => {
    if (res) {
      return null;
    }
    log(`Found invalid channel: ${c.channelId}`);
    return rmChannel(c.channelId);
  }));
  const { channels, users, guilds } = await dbSanityCheck();
  log(`✅ DB sanity check completed!\n${channels + deletedChannels.reduce((prev, del) => (del ? prev + del.channels : prev), 0)} channels, ${guilds} guilds, ${users} users removed.`);

  const disableSanityCheck = !!Number(process.env.DISABLE_SANITY_CHECK);
  if (!disableSanityCheck) {
    log('⚙️ Starting users sanity check, this could take a while if you have lots of users. You can disable this in .env');
    const limit = Number(process.env.USERS_BATCH_SIZE);
    const timeout = Number(process.env.USERS_CHECK_TIMEOUT);
    if (Number.isNaN(limit) || Number.isNaN(timeout)) {
      log('❌ USERS_BATCH_SIZE or USERS_CHECK_TIMEOUT is not set to a valid number, sanity check aborted');
      return;
    }
    const cursor = 0;
    const deleted = await usersSanityCheck(limit, cursor, timeout * 3600);
    log(`✅ Users sanity check completed! ${deleted} invalid users removed.`);
  }
};
