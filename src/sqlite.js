import SQLite3 from "sqlite3";
import * as config from "../config.json";
const sqlite3 = SQLite3.verbose();
import log from "./log";

let db = null;

export const open = () =>
  new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.dbFile, err => {
      if (err) reject(err);
      else {
        log(`Successfully opened database: ${config.dbFile}`);
        resolve();
      }
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
    db.all(
      withInfo
        ? "SELECT subs.channelId AS channelId, flags, guildId, ownerId, subs.isDM AS isDM FROM subs INNER JOIN channels ON subs.channelId = channels.channelId WHERE twitterId=?;"
        : "SELECT channelId, flags, isDM FROM subs WHERE twitterId=?",
      [twitterId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getChannelSubs = (channelId, withName = false) =>
  new Promise((resolve, reject) =>
    db.all(
      withName
        ? "SELECT twitterId, name, flags FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId=?"
        : "SELECT twitterId, flags FROM subs WHERE subs.channelId=?",
      [channelId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getUserIds = () =>
  new Promise((resolve, reject) => {
    db.all(`SELECT twitterId FROM twitterUsers`, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });

export const getUniqueChannels = () =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT channelId, isDM FROM channels GROUP BY guildId`,
      [],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );
export const getUserInfo = twitterId =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT name FROM twitterUsers WHERE twitterId = ?`,
      [twitterId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getGuildSubs = async guildId =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT subs.channelId AS channelId, twitterId, subs.isDM AS isDM, flags FROM subs INNER JOIN channels ON channels.channelId = subs.channelId WHERE guildId = ?`,
      [guildId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getTwitterIdFromScreenName = async name =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT userId FROM twitterUsers WHERE name = ?`,
      [name],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });

export const hasUser = async twitterId => {
  const rows = await getUserInfo(twitterId);
  return rows.length !== 0;
};

export const hasSubscription = async (twitterId, channelId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT 1 FROM subs WHERE twitterId=? AND channelId=?`,
      [twitterId, channelId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows.length !== 0);
      }
    )
  );

// Return values:
// 0: Subscription added
// 1: Subscription updated
export const addSubscription = async (channelId, twitterId, flags, isDM) => {
  const subExists = await hasSubscription(twitterId, channelId);
  return new Promise((resolve, reject) => {
    if (subExists) {
      // TODO: Update
      db.run("UPDATE ...", [channelId, twitterId, flags], err => {
        if (err) reject(err);
        resolve(1);
      });
    } else {
      db.run(
        "INSERT INTO subs(channelId, twitterId, flags, isDM) VALUES(?, ?, ?, ?)",
        [channelId, twitterId, flags, isDM],
        err => {
          if (err) reject(err);
          resolve(0);
        }
      );
    }
  });
};

export const addUser = async (twitterId, name) =>
  new Promise((resolve, reject) =>
    db.run(
      `INSERT INTO twitterUsers(twitterId, name) VALUES(?, ?)`,
      [twitterId, name],
      err => {
        if (err) reject(err);
        resolve();
      }
    )
  );

export const rmUser = async twitterId =>
  new Promise((resolve, reject) =>
    // TODO: DELETE
    db.run(`DELETE ...`, [twitterId], err => {
      if (err) reject(err);
      resolve();
    })
  );

// Return value: How many subscriptions were deleted
export const removeSubscription = async (channelId, twitterId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT 1 FROM subs WHERE twitterId=? AND channelId=?`,
      [twitterId, channelId],
      (err, rows) => {
        if (err) reject(err);
        else if (rows.length === 0) {
          resolve(0);
        } else {
          // TODO: delete
          db.run("DELETE ...", [channelId, twitterId], err => {
            if (err) {
              reject(err);
            } else {
              resolve(rows.length);
            }
          });
        }
      }
    )
  );
