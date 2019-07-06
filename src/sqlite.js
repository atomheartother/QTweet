import SQLite3 from "sqlite3";
import * as config from "../config.json";
const sqlite3 = SQLite3.verbose();
import log from "./log";
let db = null;

const GETINT = (val, alias = val) => `CAST(${val} AS TEXT) AS ${alias}`;

export const open = () =>
  new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.dbFile, err => {
      if (err) reject(err);
      else {
        db.all(
          "select name from sqlite_master where type='table'",
          [],
          async (err, tables) => {
            if (err) reject(err);
            console.log(tables);
            if (tables.length === 3) {
              log(`Successfully opened database at ${config.dbFile}`);
              resolve();
            } else {
              await initTables();
              log(`Database at ${config.dbFile} successfully initialized`);
              resolve();
            }
          }
        );
        resolve();
      }
    });
  });

const initTables = () =>
  new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS twitterUsers(twitterId INTEGER PRIMARY KEY, name TEXT)`,
        err => {
          if (err) {
            log("Error creating twitterUsers table");
            reject(err);
          }
        }
      )
        .run(
          `CREATE TABLE IF NOT EXISTS subs(twitterId INTEGER, channelId INTEGER, isDM INTEGER NOT NULL, flags INTEGER NOT NULL, PRIMARY KEY(twitterId, channelId))`,
          err => {
            if (err) {
              log("Error creating subs table");
              reject(err);
            }
          }
        )
        .run(
          `CREATE TABLE IF NOT EXISTS channels(channelId INTEGER PRIMARY KEY, ownerId INTEGER NOT NULL, guildId INTEGER NOT NULL, isDM INTEGER NOT NULL)`,
          err => {
            if (err) {
              log("Error creating channels table");
              reject(err);
            }
            resolve();
          }
        );
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

export const getSubscription = (twitterId, channelId, withName = false) =>
  new Promise((resolve, reject) =>
    db.get(
      withName
        ? `SELECT ${GETINT("subs.channelId", "channelId")}, ${GETINT(
            "subs.twitterId",
            "twitterId"
          )}, name, flags, subs.isDM FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId = ? AND subs.twitterId = ?`
        : `SELECT ${GETINT("channelId")}, ${GETINT(
            "twitterId"
          )}, flags, isDM FROM subs WHERE channelId = ? AND twitterId = ?`,
      [channelId, twitterId],
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    )
  );

export const getUserSubs = (twitterId, withInfo = false) =>
  new Promise((resolve, reject) =>
    db.all(
      withInfo
        ? `SELECT ${GETINT("subs.channelId", "channelId")}, flags, ${GETINT(
            "guildId"
          )}, ${GETINT(
            "ownerId"
          )}, subs.isDM AS isDM FROM subs INNER JOIN channels ON subs.channelId = channels.channelId WHERE subs.twitterId=?;`
        : `SELECT ${GETINT(
            "channelId"
          )}, flags, isDM FROM subs WHERE twitterId=?`,
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
        ? `SELECT ${GETINT(
            "subs.twitterId",
            "twitterId"
          )}, name, flags FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId=?`
        : `SELECT ${GETINT(
            "twitterId"
          )}, flags FROM subs WHERE subs.channelId=?`,
      [channelId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getGuildChannels = guildId =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT ${GETINT("channelId")} FROM channels WHERE guildId = ?`,
      [guildId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getUserIds = () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT ${GETINT("twitterId")} FROM twitterUsers`,
      [],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });

export const getUniqueChannels = () =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT ${GETINT("channelId")}, isDM FROM channels GROUP BY guildId`,
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
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    )
  );

export const getGuildSubs = guildId =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT ${GETINT("subs.channelId", "channelId")}, ${GETINT(
        "twitterId"
      )}, subs.isDM AS isDM, flags FROM subs INNER JOIN channels ON channels.channelId = subs.channelId WHERE guildId = ?`,
      [guildId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    )
  );

export const getTwitterIdFromScreenName = name =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT ${GETINT("userId")} FROM twitterUsers WHERE name = ?`,
      [name],
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    );
  });

export const hasUser = async twitterId => {
  const row = await getUserInfo(twitterId);
  return !!row;
};

export const hasSubscription = (twitterId, channelId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT 1 FROM subs WHERE twitterId=? AND channelId=?`,
      [twitterId, channelId],
      (err, row) => {
        if (err) reject(err);
        resolve(row !== undefined);
      }
    )
  );

// Return values:
// 0: Subscription added
// 1: Subscription updated
export const addSubscription = async (channelId, twitterId, flags, isDM) => {
  const subExists = await hasSubscription(twitterId, channelId);
  return await new Promise((resolve, reject) => {
    if (subExists) {
      db.run(
        "UPDATE subs SET flags = ? WHERE channelId = ? AND twitterId = ?",
        [flags, channelId, twitterId],
        err => {
          if (err) reject(err);
          resolve(1);
        }
      );
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

export const addUser = (twitterId, name) =>
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

export const rmUser = twitterId =>
  new Promise((resolve, reject) =>
    db.run(`DELETE FROM twitterUsers WHERE twitterId = ?`, [twitterId], err => {
      if (err) reject(err);
      resolve();
    })
  );

// Return value: How many subscriptions were deleted
export const removeSubscription = (channelId, twitterId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT 1 FROM subs WHERE twitterId=? AND channelId=?`,
      [twitterId, channelId],
      (err, row) => {
        if (err) reject(err);
        else if (row === undefined) {
          resolve(0);
        } else {
          // TODO: delete
          db.run(
            "DELETE FROM subs WHERE channelId = ? AND twitterId = ?",
            [channelId, twitterId],
            err => {
              if (err) reject(err);
              resolve(1);
            }
          );
        }
      }
    )
  );

export const rmChannel = channelId =>
  new Promise((resolve, reject) =>
    db.run(`DELETE FROM channels WHERE channelId = ?`, [channelId], err => {
      if (err) reject(err);
      resolve();
    })
  );
