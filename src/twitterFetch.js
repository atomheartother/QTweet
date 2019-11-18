// This module takes care of using fetches to act as a stream
import { postTweetWithSubs, isValid, getTimeline } from './twitter';
import { getAllUsers, updateRecommendedFetchDate, updateUserData, getUserSubs } from './subs'
import { isArray } from 'util';

// Check every minute
const checkInterval = 1000 * 60;
// How do we divide the hour for our resets?
const resetsPerHour = 5;
// Calculate the reset interval in ms
const resetInterval = (1000 * 60 * 60) / resetsPerHour;
// Add at least this many ms in case of failure
const minDelay = 1000 * 60 * 15;

// Keeps track of the tweet-to-post values for the reset window.
let tweetToPost = [];

// Max timeline requests per reset window
const maxRequests = 4000 / resetsPerHour;
// Total
let requests = 0;
let nextReset = Date.now();

let intervals = [null, null];

export const userTimeline = async params => {
    requests++;
    const timeline =  await getTimeline(params);
    if (!isArray(timeline)) {
        if (!timeline.error) {
            console.error("Weirdly formatted error getting timeline:");
            console.error(timeline);
        }
        else if (timeline.error === 'Not authorized.') {
            console.error(`User is unauthorized: ${params.user_id}`);
        } else {
            console.error("Unknown error getting timeline:");
            console.error(timeline);
        }
        return [];
    }
    return timeline;
  };
  
// lastFetchDate is epoch, could be null
const getNextFetchDateFromTweets = (dates, lastFetchDate) => {
  const now = Date.now();
  const timesArray = lastFetchDate ? [lastFetchDate, ...dates, now] : [...dates, now];
  // If we somehow don't even have 2 time points, then just use the min value
  if (timesArray.length < 2) {
    return now + minDelay;
  }
  // Ok so we now have an array of timepoints from oldest to newest
  // We need the average of the interval between each consequent value.
  let meanTweetInterval = 0;
  for (let i=0; i < timesArray.length - 1; i++) {
    meanTweetInterval += Math.abs(timesArray[i+1] - timesArray[i])
  }
  meanTweetInterval /= timesArray.length - 1;
  console.log(`Mean interval between ${dates.length} tweets: ${meanTweetInterval / (1000 * 60)}min`);
  // We now have the average time this user takes to tweet.
  // We add it to the last tweet we got, if it's after now, use this value
  if (dates[dates.length - 1] + meanTweetInterval > now) {
    // Add a 5% margin to catch slightly late tweets
    return dates[dates.length - 1] + (meanTweetInterval * 1.05);
  }
  // Otherwise try starting now, doubling the interval
  return now + (meanTweetInterval * 2);
}

// twitterId: The user's unique ID
// lastFetchDate: The time we last got the user's data. Also the time !!start was run if we never got any tweets.
//      Users are queued in order of last fetch date, so the ones who never get posted are always checked first.
//      We call this queue privilege and you lose it when you tweet anything.
// recommendedFetchDate: The date at which we think we should try again. Also the time !!start was run if the user was never checked.
// lastTweetId: Last time we got a tweet, we recorded its last ID.
const checkUser = async ({
  twitterId,
  name,
  lastFetchDate,
  recommendedFetchDate = Date.now(),
  lastTweetId
}) => {
  if (recommendedFetchDate > Date.now())  {
    // If it's not your time, it's not your time, do nothing
    console.log(`${name}: Was checked but it wasn't their time.`);
    return;
  }

  if (requests > maxRequests) {
    console.log(`${name}: No more requests, next check at next reset ${nextReset}`);
    // Set the next check to be @ next reset, don't update any other data to keep queue privileges
    updateRecommendedFetchDate(twitterId, nextReset);
    return;
  }
  // We should now get their latest tweets.
  const params = {
    user_id: twitterId,
    tweet_mode: "extended",
    include_rts: true,
    count: 200, // Get the max value possible
  };  
  // This costs us one call
  let tweets = await userTimeline(params);
  // Filter out invalid tweets
  tweets = tweets.filter(tweet => !(tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== tweet.user.id) && isValid(tweet));
  // If we have a last ID, trim tweets, otherwise just use the last few ones & post the latest one
  let onlyPostLatest = !lastTweetId;
  if (lastTweetId) {
    const idx = tweets.findIndex(({id_str}) => id_str === lastTweetId);
    if (idx !== -1) {
      tweets = tweets.slice(0, idx);
    }
  }
  if (tweets.length > 0) {
    // Post tweet here
    const subs = await getUserSubs(tweets[0].user.id_str);
    // Tweets -> Epoch times
    const dates = [];
    // Go through the tweets list backwards and do all the computrons we need
    for (let i=tweets.length - 1 ; i >= 0 ; i--) {
      const time = new Date(tweets[i].created_at);
      if (!onlyPostLatest || i === 0) {
        postTweetWithSubs(tweets[i], subs);
        tweetToPost.push(Date.now() - time.getTime());
      }
      // Even if we don't post the tweet, use it for our time calculations
      if (!isNaN(time.getTime())) {
        dates.push(time.getTime());
      }
    }
    const newLastFetchDate = dates.length > 0 ? dates[dates.length - 1] : Date.now();
    const newRecommended = getNextFetchDateFromTweets(dates, lastFetchDate);
    console.log(`${name}: Got ${tweets.length} tweets, next fetch at ${(new Date(newRecommended)).toLocaleString()}`)
    updateUserData(twitterId, newLastFetchDate, newRecommended, tweets[0].id_str);
    return;
  }
  // No tweets, bad user made us waste a request >:c
  // Increase the recommended fetch date.
  let nextDelay = lastFetchDate ? (Date.now() - lastFetchDate) * 2 : minDelay;
  if (nextDelay < minDelay) {
    // Apply minimum delay because they were bad boys
    nextDelay = minDelay;
  }
  console.log(`${name}: Fetch yieled no tweets, next check in ${nextDelay / 1000}s`);
  updateRecommendedFetchDate(twitterId, Date.now() + nextDelay);
};

const checkAllUsers = async () => {
  // This function fetches all twitter users & their metadata
  // Data should be ordered by last fetch ASCENDING so we start with the oldest ones
  const users = await getAllUsers();
  // Check each user
  for (let i = 0; i < users.length; i++) {
    checkUser(users[i]);
  }
} 

const requestReset = () => {
    nextReset = Date.now() + resetInterval;
    console.log(`Resetting requests. Remaining requests: ${maxRequests - requests}`);
    requests = 0;
    if (tweetToPost.length < 1) return;
    let meanTweetToPost = 0;
    for (let i=0; i < tweetToPost.length ; i++) {
      meanTweetToPost += tweetToPost[i];
    }
    meanTweetToPost /= tweetToPost.length;
    console.log(`Mean tweet-to-post: ${meanTweetToPost / (1000 * 60 * 60)}min`);
}

export const stop = () => {
    for (let i=0 ; i < intervals.length ; i++) {
        if (intervals[i]) {
            clearInterval(intervals[i]);
        }
        intervals[i] = null;
    }
}

export const init = () => {
    stop();
    requestReset();
    checkAllUsers();
    intervals[0] = setInterval(checkAllUsers, checkInterval);
    intervals[1] = setInterval(requestReset, resetInterval);
};
