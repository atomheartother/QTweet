import SQLite3 from "sqlite3";
import * as config from "../config.json";
const sqlite3 = SQLite3.verbose();
import log from "./log";

const db = new sqlite3.Database(config.getFile, err => {
  if (err) {
    return console.error(err.message);
  }
  log(`Connected to database at ${config.getFile}`);
});

const closeDb = () => {
  log("Closing database");
  db.close();
};

export const getUserSubs = twitterId =>
  new Promise((resolve, reject) =>
    db.run(
      "SELECT channelId, flags, isDM FROM subs WHERE twitterId=?",
      [twitterId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    )
  );

export const getChannelSubs = channelId =>
  new Promise((resolve, reject) =>
    db.run(
      "SELECT twitterId, name, flags, isDM FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId=?",
      [channelId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    )
  );

process.on("exit", closeDb);
process.on("SIGINT", closeDb);
process.on("SIGKILL", closeDb);
