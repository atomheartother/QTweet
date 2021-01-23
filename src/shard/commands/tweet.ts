import { getScreenName } from "./helpers";
import {
    translated,
    embeds
  } from '../post';
import * as checks from './checks';
import {
    cmd,
  } from '../master';
import QChannel from "../QChannel/QChannel";
import log from "../../log";
import { CmdFn } from ".";
import { formatTweet } from "../../twitter";

export const handleUserTimeline = async ({
  qc,
  res: tweets,
  msg: { screen_name: screenName, flags },
}) => {
  const qChannel = QChannel.unserialize(qc);

  if (tweets.error) {
    if (tweets.error === 'Not authorized.') {
      translated(qChannel, 'tweetNotAuthorized', { screenName });
    } else {
      translated(qChannel, 'tweetUnknwnError', {
        error: tweets.error,
        screenName,
      });
      log('Unknown error on twitter timeline', qChannel);
      log(tweets.error, qChannel);
    }
    return;
  }
  if (tweets.length < 1) {
    translated(qChannel, 'noTweets', { screenName });
    return;
  }
  const validTweets = tweets.filter((t) => t && t.user);
  if (validTweets.length === 0) {
    translated(qChannel, 'noValidTweets');
    log('Invalid tweets from timeline', qChannel);
    log(tweets, qChannel);
    return;
  }
  const formattedTweets = await Promise.all(validTweets.map((t) => formatTweet(t, false)));
  const posts = formattedTweets.map(({ embed }) => embed);
  const reverseOrder = flags.indexOf('reverse') !== -1;
  const {
    successful,
    err,
    // So I know this is weird but we originally got tweets in the WRONG order,
    // from most recent to oldest
    // If we get the reverse flag, we therefore DON'T reverse, we just leave it in the wrong order
  } = await embeds(qChannel, reverseOrder ? posts : posts.reverse());
  if (err) {
    log(`Error posting tweet ${successful + 1} / ${validTweets.length} from ${screenName}`, qChannel);
    log(err);
    return;
  }
  log(
    `Posted latest ${successful} tweet(s) from ${screenName}`,
    qChannel,
  );
};


const postTimeline = async (qChannel: QChannel, screenName: string, count: number, flags: string[]) => {
    cmd('tweet', {
      screen_name: screenName, tweet_mode: 'extended', count, qc: qChannel.serialize(), flags,
    });
  };
  
const tweet: CmdFn = async ({ args, flags, options }, qChannel, author) => {
    let force = false;
    let screenNames = args.map(getScreenName);
    if (flags.indexOf('force') !== -1) force = true;
    const isMod = await checks.isChannelMod(author, qChannel);
    let count = options.count ? Number(options.count) : 1;
    if (!count || Number.isNaN(count)) {
        translated(qChannel, 'countIsNaN', { count: options.count });
      return;
    }
    const maxCount = 5;
    const aLot = 15;
    if (!isMod && count * screenNames.length > maxCount) {
      if (screenNames.length === 1) count = maxCount;
      else {
        screenNames = screenNames.slice(0, maxCount);
        count = Math.floor(maxCount / screenNames.length);
      }
      translated(qChannel, 'tweetCountLimited', {
        maxCount: count * screenNames.length,
      });
    }
    if (count < 1) {
      translated(qChannel, 'tweetCountUnderOne', { count });
      return;
    }
    if (count * screenNames.length >= aLot && !force) {
      log('Asked user to confirm', qChannel);
      translated(qChannel, 'tweetCountHighConfirm', {
        screenName: screenNames.join(' '),
        count,
      });
      return;
    }
    screenNames.forEach((screenName: string) => postTimeline(qChannel, screenName, count, flags));
};

export default tweet;