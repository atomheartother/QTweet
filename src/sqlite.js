import SQLite3 from "sqlite3";
import * as config from "../config.json";
const sqlite3 = SQLite3.verbose();
import log from "./log";

let db = null;

export const open = () =>
  new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.getFile, err => {
      if (err) reject(err);
      else resolve();
    });
  });

export const close = () => {
  if (!db) return;
  db.close(err => {
    if (err) {
      log("Error closing database");
      log(err);
      return;
    }
    log("Closed database successfully");
  });
  db = null;
};

export const getUserSubs = (twitterId, withInfo = false) =>
  new Promise((resolve, reject) =>
    db.run(
      withInfo
        ? "SELECT subs.channelId AS channelId, flags, guildId, ownerId, subs.isDM AS isDM FROM subs INNER JOIN channels ON subs.channelId = channels.channelId WHERE twitterId=?;"
        : "SELECT channelId, flags, isDM FROM subs WHERE twitterId=?",
      [twitterId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    )
  );

export const getChannelSubs = (channelId, withName = false) =>
  new Promise((resolve, reject) =>
    db.run(
      withName
        ? "SELECT twitterId, name, flags FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId=?"
        : "SELECT twitterId, flags FROM subs WHERE subs.channelId=?",
      [channelId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    )
  );

export const getUserIds = () =>
  new Promise((resolve, reject) => {
    db.run(`SELECT twitterId FROM twitterUsers`, null, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

export const getUserInfo = twitterId =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT name FROM twitterUsers WHERE twitterId = ?`,
      [twitterId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    )
  );
