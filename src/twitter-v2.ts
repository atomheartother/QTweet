import { TwitterApi, ETwitterApiError, TweetV2SingleStreamResult, TweetV2, ApiV2Includes } from 'twitter-api-v2';
import Stream from './twitterStream';
import Backup from './backup';
import log from './log';
import { isSet } from './flags';
import {
  updateUser,
  getUserIds,
} from './db/user';
import { post } from './shardMgr/shardManager';
import { isValid, formatTweetText, colors } from './twitter'
import {
  getUserSubsNoJoin,
} from './db/subs';

const consumerClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET_KEY,
});

let tClient2 : TwitterApi;

const DISABLE_STREAMS = !!Number(process.env.DISABLE_STREAMS);

// Stream object, holds the twitter feed we get posts from, initialized at the first
let stream = null;

export const twitterClientLogin = async (): Promise<void> => {
  tClient2 = await consumerClient.appLogin();
}

export const destroyStream = () => {
  if (stream) { stream.disconnected(); }
};

const reconnectionDelay = new Backup({
  mode: 'exponential',
  startValue: 2 * 1000,
  maxValue: Number(process.env.TWITTER_MAX_RECONNECT_DELAY) || 240000,
});

let reconnectionTimeoutID = null;
const createStreamClearTimeout = () => {
  reconnectionTimeoutID = null;
  createStream();
};

// Checks if a v2 tweet has any media attached. If false, it's a text tweet
export const hasMedia = ({
  attachments
}: TweetV2, includes: ApiV2Includes) => (attachments
  && attachments.media_keys
  && attachments.media_keys.length > 0
  && includes && includes.media
  && attachments.media_keys.every(a => includes.media.some(({media_key}) => a === media_key)))

// Takes a v2 tweet and creates its embed.
const createTweetEmbed = async (tweet: TweetV2, includes: ApiV2Includes) => {
  const { text, entities } = tweet;
  const author = includes && includes.users
    && includes.users.find(u => u.id === tweet.author_id);
  const embed : any = {
    url: `https://twitter.com/${author.username}/status/${tweet.id}`,
    author: {
      name: author.name === author.username ? `@${author.username}` : `${author.name} (@${author.username})`,
      url: `https://twitter.com/${author.username}/status/${tweet.id}`,
    },
    thumbnail: {
      url: author.profile_image_url,
    },
  };
  const isTextTweet = !hasMedia(tweet, includes);
  const { text: formattedText, metadata: { preview: image } } = await formatTweetText(
    text,
    entities,
    isTextTweet,
  );
  const txt = formattedText;
  let files = [];
  if (isTextTweet) {
    // Text tweet
    if (image) {
      embed.image = { url: image };
    }
    embed.color = colors.text;
  } else {
    const {
      type,
      url,
      variants,
    } = includes.media.find(
      ({media_key}) => media_key === tweet.attachments.media_keys[0]
    );
    if (type === 'animated_gif' || type === 'video') {
      // Gif/video
      let vidurl = null;
      for (const vid of variants) {
        // Find the best video
        if (vid.content_type === 'video/mp4' && vid.bit_rate < 1000000) {
          const paramIdx = vid.url.lastIndexOf('?');
          const hasParam = paramIdx !== -1 && paramIdx > vid.url.lastIndexOf('/');
          vidurl = hasParam ? vid.url.substring(0, paramIdx) : vid.url;
        }
      }
      if (vidurl !== null) {
        embed.video = { url: vidurl };
      } else {
        log('Found video tweet with no valid url');
      }
      embed.color = colors.video;
    } else {
      // Image(s)
      if (tweet.attachments.media_keys.length === 1) {
        embed.image = { url: url };
      } else {
        files = tweet.attachments.media_keys.map(
          (mk) => includes.media.find(m => mk === m.media_key).url
        );
      }
      embed.color = colors.image;
    }
  }
  embed.description = txt;
  return { embed: embed, files: files };
};
// Takes a v2 tweet with tweet refs and creates embed(s) for posting.
const embedTweets = async ({data: tweet, includes}: TweetV2SingleStreamResult) => {
  const {
    retweeted: retweet,
    quoted: quote,
  } = tweet.referenced_tweets
    && tweet.referenced_tweets.reduce<{retweeted: TweetV2 | null, quoted: TweetV2 | null}>((a, c) => {
      // Referenced_tweets[].type is key
      a[c.type] = includes && includes.tweets
        // Find the actual tweet for the value
        && includes.tweets.find(e => e.id === c.id);
      return a;
    }, {retweeted: null, quoted: null}) || {};
  let current = null;
  if (retweet) {
    current = await createTweetEmbed(retweet, includes);
    const author = includes && includes.users
      && includes.users.find(u => u.id === tweet.author_id);
    current.embed.author.name += ` [RT BY @${author.username}]`;
  } else {
    current = await createTweetEmbed(tweet, includes);
    if (tweet.in_reply_to_user_id) {
      const author = includes && includes.users
        && includes.users.find(u => u.id === tweet.in_reply_to_user_id);
      current.embed.author.name += ` [REPLY TO @${author.username}]`;
    }
  }
  if (quote) {
    const quoteEmbed = await createTweetEmbed(quote, includes);
    quoteEmbed.embed.author.name = `[QUOTED] ${quoteEmbed.embed.author.name}`;
    return [current, quoteEmbed];
  }
  return [current];
};

// Takes a tweet and determines whether or not it should be posted with these flags
const flagsFilter = (flags: number, tweet: TweetV2SingleStreamResult) => {
  if (isSet(flags, 'notext') && !hasMedia(tweet.data, tweet.includes)) {
    return false;
  }
  if (!isSet(flags, 'retweets') && tweet.data.referenced_tweets?.some(t => t.type === 'retweeted')) return false;
  if (isSet(flags, 'noquotes') && tweet.data.referenced_tweets?.some(t => t.type === 'quoted')) return false;
  if (!isSet(flags, 'replies') && tweet.data.referenced_tweets?.some(t => t.type === 'replied_to'
        && tweet.includes.tweets.find(i => i.id === t.id).author_id !== tweet.data.author_id)) return false;
  return true;
};

export const getFilteredSubs = async (tweet: TweetV2SingleStreamResult) => {
  // Ignore invalid tweets
  if (!isValid(tweet)) return [];
  // Ignore tweets from people we don't follow
  // and replies unless they're replies to oneself (threads)
  const subs = await getUserSubsNoJoin(tweet.data.author_id);
  if (
    !subs
    || subs.length === 0
  ) return [];

  const targetSubs = [];
  for (let i = 0; i < subs.length; i += 1) {
    const {
      flags, channelId, isDM, msg,
    } = subs[i];
    if (isDM) log(`Should we post ${tweet.data.id} in channel ${channelId}?`, null, true);
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
  reconnectionDelay.reset();
};

// Called when we receive data
const streamData = async (tweet: TweetV2SingleStreamResult) => {
  log(`✅ Received new data: ${JSON.stringify(tweet)}`, null, true);
  const subs = await getFilteredSubs(tweet);
  if (subs.length === 0) {
    log('✅ Discarded a tweet', null, true);
    return;
  }
  log(`✅ Received valid tweet: ${tweet.data.id}, forwarding to ${subs.length} Discord subscriptions`, null, true);
  const [main, quote] = await embedTweets(tweet);
  subs.forEach(({ flags, qChannel, msg }) => {
    const embed : any = { embeds: [main.embed], files: main.files };
    if (msg) {
      embed.content = msg;
    }
    if (quote && !isSet(flags, 'noquotes')) {
      embed.embeds.push(quote.embed);
      Array.prototype.push.apply(embed.files, quote.files);
      if (main.embed.image?.url === quote.embed.image?.url) {
        embed.embeds[0] = structuredClone(main.embed);
        embed.embeds[0].photo = null;
      }
    }
    post(qChannel, embed, 'embed');
  });
  updateUser(tweet.includes.users.find(u => u.id === tweet.data.author_id));
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
const streamError = ({ type, error: { type: innerType, code, data: { detail } }, message }) => {
  if (type === 'connect error' && innerType === ETwitterApiError.Response && code === 420) {
    log('⚙️ 420 status code detected, exiting cleanly to reboot bot', null, false);
    process.exit();
  }
  // We simply can't get a stream, don't retry
  stream.disconnected(false);
  const delay = reconnectionDelay.value();
  if (reconnectionTimeoutID) {
    clearTimeout(reconnectionTimeoutID);
  } else {
    reconnectionDelay.increment();
  }
  if (innerType === ETwitterApiError.Response) {
    log(
      `❌ Twitter Error ${code}: ${detail} Reconnecting in ${delay}ms`,
    );
  } else {
    log({ type: type, innerType: innerType, code: code, detail: detail, message: message });
  }
  // eslint-disable-next-line no-use-before-define
  reconnectionTimeoutID = setTimeout(createStreamClearTimeout, delay);
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
      tClient2,
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
