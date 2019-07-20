import db from "./dbTest";
import tweets from "./tweetsTest";

const test = async () => {
  const tests = [db, tweets];
  for (let i = 0; i < tests.length; i++) {
    if (await tests[i]()) {
      return;
    }
  }
  console.log("All tests passed successfully");
};

test();
