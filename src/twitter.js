import Twitter from 'twitter-lite';
import unfurl from 'unfurl.js';
import log from './log';
import { someoneHasChannel } from './shardMgr/shardManager';
import {
  getUsersForSanityCheck,
  bulkDeleteUsers,
} from './db/user';
import {
  getChannels,
  rmChannel,
} from './db/channels';
import {
  sanityCheck as dbSanityCheck,
} from './db';

export const colors = Object.freeze({
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

// Checks if a v1 tweet has any media attached. If false, it's a text tweet
export const hasMedia = ({
  extended_entities: extendedEntities,
  extended_tweet: extendedTweet,
  retweeted_status: retweetedStatus,
}) => (
  (extendedEntities
    && extendedEntities.media
    && extendedEntities.media.length > 0)
  || (extendedTweet
    && extendedTweet.extended_entities
    && extendedTweet.extended_entities.media
    && extendedTweet.extended_entities.media.length > 0)
  || (retweetedStatus
    && retweetedStatus.extended_entities
    && retweetedStatus.extended_entities.media
    && retweetedStatus.extended_entities.media.length > 0)
);

// Validation function for tweets
export const isValid = (tweet) => !(
  // Ignore undefined or null tweets
  !tweet || !tweet.data || !tweet.data.id
  // Ignore tweets without a user object
  || !tweet.data.author_id
  || !tweet.includes
  || !tweet.includes.users
);

const unfurlUrl = async (url) => {
  const { expanded_url: expandedUrl, indices = [ url.start, url.end ] } = url;
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

export const formatTweetText = async (text, entities, isTextTweet) => {
  if (!entities) return text;
  const { user_mentions: userMentions, mentions, urls, hashtags, cashtags } = entities;
  const changes = [];
  const metadata = {};
  let offset = 0;
  // Remove all the @s at the start of the tweet to make it shorter
  let inReplies = true;
  let replyIndex = 0;
  if (userMentions || mentions) {
    // v1 user_mentions:
    (userMentions && userMentions.filter(
      ({ screen_name: screenName, indices }) => screenName && indices && indices.length === 2
      // v2 mentions conversion:
    ) || mentions.reduce(
      (a, { start, end, username }) => {
        if((start || start === 0) && end && username) {
          a.push({screen_name: username, indices: [start, end]});
        }
        return a;
      }, [],
    ))
    // Handle mentions for both APIs
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
      .filter(({ text: hashtagTxt, indices, tag, start, end }) => {
        hashtagTxt && indices && indices.length === 2 || tag && start && end
      })
      .forEach(({ text: hashtagTxt, indices, tag, start, end }) => {
        if (indices) {
          [start, end] = indices;
          tag = hashtagTxt;
        }
        changes.push({
          start,
          end,
          newText: `[#${tag}](https://twitter.com/hashtag/${tag}?src=hash)`,
        });
      });
  }
  if (cashtags) {
    cashtags
      .filter(({ tag, start, end }) => tag && start && end)
      .forEach(({ tag, start, end }) => {
        changes.push({
          start,
          end,
          newText: `[$${tag}](https://twitter.com/search?q=%24${tag}&src=cashtag)`,
        });
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

// Takes a v1 tweet and formats it for posting.
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
  return { embed: { embeds: [embed], files }, metadata };
};

export const getError = (response) => {
  if (!response || !response.errors || response.errors.length < 1) return { code: null, msg: null };
  return response.errors[0];
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
