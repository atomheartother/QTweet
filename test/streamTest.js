import { getFilteredSubs, formatTweet } from "../src/twitter";
import { text, video, album, image } from "./exampleTweets";

const testTextTweet = () => {
  const {
    embed: { embed, files },
    metadata
  } = formatTweet(text);
  if (embed.description !== text.text) {
    console.error("Failed text tweet formatting: description is wrong");
    console.error(text.text);
    console.error(embed.description);
    return 1;
  }
  if (files !== null) {
    console.error(`Files is non-null on a text tweet`);
    return 1;
  }
  return 0;
};

const testFormatting = () => {
  if (testTextTweet()) {
    return 1;
  }
  return 0;
};

const test = () => {
  if (testFormatting()) {
    return;
  }
  console.log("All tests successful");
};

test();
