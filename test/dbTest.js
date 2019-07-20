import fs from "fs";
import {
  add as subAdd,
  getSub,
  init,
  close,
  rm,
  getChannelSubs,
  rmChannel
} from "../src/subs";
import { compute } from "../src/flags";
import log from "../src/log";

const dbFile = "./tempDb.db";

const add = async (channelId, twitterId, name, flags, isDM) => {
  const res = await subAdd(channelId, twitterId, name, flags, isDM);
  const sub = await getSub(channelId, twitterId, true);
  if (!sub) {
    console.error("Couldn't find added subscription");
    console.log(channelId, twitterId, name, flags, isDM);
    return null;
  }
  if (
    sub.channelId !== channelId ||
    sub.twitterId !== twitterId ||
    sub.name !== name ||
    sub.flags !== flags ||
    sub.isDM !== isDM
  ) {
    console.error("Inserted values differ from actual values");
    console.log(channelId, twitterId, name, flags, isDM);
    console.error(sub);
    return null;
  }
  return res;
};

const addSubsTests = async () => {
  // Adding a new user
  let res = await add("1234567890", "987654321", "twitterUser", 0, 0);
  if (res === null) return 1;

  if (res.subs !== 1) {
    console.error("Adding user returned an update message");
    console.error(res);
    return 1;
  }
  if (res.users !== 1) {
    console.error("New user wasn't created");
    console.error(res);
    return 1;
  }
  const flags = compute(["retweet", "noquote"]);
  // Updating a subscription
  res = await add("1234567890", "987654321", "twitterUser", flags, 0);
  if (res === null) return;
  if (res.subs !== 0) {
    console.log("Updating flag caused an insertion instead");
    console.error(res);
    return 1;
  }
  if (res.users !== 0) {
    console.log("Update somehow caused a new user to be created");
    console.error(res);
    return 1;
  }
  // Adding a new user to the same channel
  res = await add("1234567890", "424242", "otherUser", 1, 0);
  if (res === null) return 1;

  if (res.subs !== 1) {
    console.error("Adding 2nd user returned an update message");
    console.error(res);
    return 1;
  }
  if (res.users !== 1) {
    console.error("Adding a 2nd user didn't create a new user");
    console.error(res);
    return 1;
  }
  // Adding an existing user to a new channel
  res = await add("666", "424242", "otherUser", 1, 0);
  if (res === null) return 1;
  if (res.subs !== 1) {
    console.log(
      "New subscription on existing user didn't create a new subscription"
    );
    console.error(res);
    return 1;
  }
  if (res.users !== 0) {
    console.log("New subscription on existing user created a new user");
    console.error(res);
    return 1;
  }
  return 0;
};

const rmSubTests = async () => {
  // Deleting a single sub with a single user
  let res = await rm("1234567890", "987654321");
  if (res.subs !== 1) {
    console.error("Couldn't delete sub we know exists");
    console.error(res);
    return 1;
  }
  if (res.users !== 1) {
    console.error("Deleting single-user sub did not delete user");
    console.error(res);
    return 1;
  }
  // Deleting the same sub again
  res = await rm("1234567890", "987654321");
  if (res.subs !== 0 || res.users !== 0) {
    console.error("Deleting sub twice worked somehow");
    console.error(res);
    return 1;
  }
  // Deleting a sub with 2 subs for this user
  res = await rm("1234567890", "424242");
  if (res.subs !== 1) {
    console.error("Couldn't delete other sub we know exists");
    return 1;
  }
  if (res.users !== 0) {
    console.error("Deleting a 2-sub user subscription deleted the user.");
    return 1;
  }
  res = await rm("666", "424242");
  if (res.subs !== 1) {
    console.error("Deleting 2nd 2-sub user sub didn't delete a sub???");
    return 1;
  }
  if (res.users !== 1) {
    console.error("Deleting 2nd 2-user user sub didn't delete user");
    return 1;
  }
  if ((await add("1010101", "7", "thisGuy", 5, 0)) < 0) return 1;
  if ((await add("1010101", "4", "thatGuy", 3, 0)) < 0) return 1;
  if ((await add("1010101", "2", "otherGuy", 2, 0)) < 0) return 1;
  res = await getChannelSubs("1010101");
  if (res.length !== 3) {
    console.error("Wrong number of results channels");
    console.error(res);
    return 1;
  }
  res = await rmChannel("1010101");
  if (res.subs !== 3 || res.users !== 3) {
    console.error("rmChannel failed");
    console.error(res);
    return 1;
  }
  if (res) res = await getChannelSubs("1010101");
  if (res.length !== 0) {
    console.error("Wrong number of results channels");
    console.error(res);
    return 1;
  }
  return 0;
};

const test = async () => {
  log("## Starting database tests");
  await init(dbFile);
  if ((await addSubsTests()) !== 0) return 1;
  if ((await rmSubTests()) !== 0) return 1;
  close();
  fs.unlinkSync(dbFile);
  log("## Database tests successful");
  return 0;
};

export default test;
