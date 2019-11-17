// This module takes care of using fetches to act as a stream
import { postTweetWithSubs, isValid, getTimeline } from './twitter';
import { getAllUsers, updateRecommendedFetchDate, updateUserData, getUserSubs } from './subs'

// Check every 10
const checkInterval = 1000 * 10;
// Reset every 15min
const resetInterval = 1000 * 60 * 15;
// Add at least this many ms in case of failure
const minDelay = 1000 * 60 * 15;

// Max timeline requests per 15min window
const maxRequests = 1000;
// Total
let requests = 0;
let nextReset = Date.now();

let intervals = [null, null];

export const userTimeline = params => {
    requests++;
    return getTimeline(params);
  };
  
const getNextFetchDateFromTweets = (tweets, lastFetchDate) => {
    const lastTweetDate = new Date(tweets[0].created_at);
    if (!isNaN(lastTweetDate.getTime())) {
        // First tweet is valid
        if (tweets.length > 1) {
            const secondTweetDate = new Date(tweets[1].created_at);
            if (!isNaN(secondTweetDate.getTime())) {
                // Ideal case: We have two tweets, we measure the time between them and assume the next post will happen with about the same frequency
                return lastTweetDate.getTime() +  (lastTweetDate.getTime() - secondTweetDate.getTime()) * 1.1;
            }
        }
        // We only have one valid tweet date.
        if (lastFetchDate) {
            // We have a lastFetchDate, giving us a second date to use as basis
            return lastFetchDate.getTime() + (lastTweetDate.getTime() - lastFetchDate) * 1.1;
        }
        // We don't have a lastFetchDate. Use the current time and the tweet date to extrapolate the next tweet.
        return Date.now() + (Date.now() - lastTweetDate.getTime()) * 2
    }
    // No valid date given for tweet. Use min delay
    return minDelay;
}

// twitterId: The user's unique ID
// lastFetchDate: The time we last got the user's data. Also the time !!start was run if we never got any tweets.
//      Users are queued in order of last fetch date, so the ones who never get posted are always checked first.
//      We call this queue privilege and you lose it when you tweet anything.
// recommendedFetchDate: The date at which we think we should try again. Also the time !!start was run if the user was never checked.
// lastTweetId: Last time we got a tweet, we recorded its last ID.
const checkUser = async ({
  twitterId,
  lastFetchDate = Date.now(),
  recommendedFetchDate = Date.now(),
  lastTweetId
}) => {
  if (recommendedFetchDate > Date.now()) return; // If it's not your time, it's not your time, do nothing
  if (requests > maxRequests) {
    console.log(`Check occurred too early, next check at next reset ${nextReset}`);
    // Set the next check to be @ next reset, don't update any other data to keep queue privileges
    updateRecommendedFetchDate(twitterId, nextReset);
    return;
  }
  console.log(`Checking user ${twitterId}`);
  // We should now get their latest tweets.
  const params = {
    user_id: twitterId,
    tweet_mode: "extended"
  };
  if (lastTweetId) {
    params.since_id = lastTweetId;
  } else {
    params.count = 1;
  }
  // This costs us one call
  let tweets = await userTimeline(params);
  // Filter out invalid tweets
  tweets = tweets.filter(tweet => isValid(tweet));
  if (tweets.length > 0) {
    // Post tweet here
    console.log("Posting tweets!");
    const subs = await getUserSubs(tweets[0].user.id_str);
    for (let i=tweets.length - 1 ; i >= 0 ; i--) {
        console.log(tweets[i]);
        postTweetWithSubs(tweets[i], subs);
    }
    const latestTweetDate = new Date(tweets[0].created_at);
    const newLastFetchDate = isNaN(latestTweetDate.getTime()) ? Date.now() : latestTweetDate.getTime()
    const newRecommended = getNextFetchDateFromTweets(tweets, lastFetchDate)
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
  console.log(`No new tweets, new delay is ${nextDelay}ms`)
  updateRecommendedFetchDate(twitterId, Date.now() + nextDelay);
};

const checkAllUsers = async () => {
  // This function fetches all twitter users & their metadata
  // Data should be ordered by last fetch ASCENDING so we start with the oldest ones
  const users = await getAllUsers();
  // Check each user
  console.log(`Checking ${users.length} users...`);
  for (let i = 0; i < users.length; i++) {
    checkUser(users[i]);
  }
} 

const requestReset = () => {
    nextReset = Date.now() + resetInterval;
    requests = 0;
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
    intervals[0] = setInterval(checkAllUsers, checkInterval);
    intervals[1] = setInterval(requestReset, resetInterval);
};
