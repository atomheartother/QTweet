import SQLite3 from "sqlite3";
import * as config from "../config.json";
const sqlite3 = SQLite3.verbose();
import log from "./log";
let db = null;

const GETINT = (val, alias = val) => `CAST(${val} AS TEXT) AS ${alias}`;

export const open = file =>
  new Promise((resolve, reject) => {
    db = new sqlite3.Database(file || config.dbFile, err => {
      if (err) return reject(err);
      else {
        db.all(
          "select name from sqlite_master where type='table'",
          [],
          async (err, tables) => {
            if (err) return reject(err);
            if (tables.length === 4) {
              log(`Successfully opened database at ${file || config.dbFile}`);
              resolve();
            } else {
              await initTables();
              log(
                `Database at ${file || config.dbFile} successfully initialized`
              );
              resolve();
            }
          }
        );
      }
    });
  });

const initTables = () =>
  new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS twitterUsers(twitterId INTEGER PRIMARY KEY, name TEXT, lastFetchDate INTEGER, recommendedFetchDate INTEGER, lastTweetId INTEGER)`,
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
          `CREATE TABLE IF NOT EXISTS guilds(guildId INTEGER PRIMARY KEY, lang TEXT NOT NULL DEFAULT '${
            config.defaultLang
          }')`,
          err => {
            if (err) {
              log("Error creating guilds table");
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

export const getSubscription = (channelId, twitterId, withName = false) =>
  new Promise((resolve, reject) =>
    db.get(
      withName
        ? `SELECT ${GETINT("subs.channelId", "channelId")}, ${GETINT(
            "subs.twitterId",
            "twitterId"
          )}, name, flags, isDM FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE subs.channelId = ? AND subs.twitterId = ?`
        : `SELECT ${GETINT("channelId")}, ${GETINT(
            "twitterId"
          )}, flags, isDM FROM subs WHERE channelId = ? AND twitterId = ?`,
      [channelId, twitterId],
      (err, row) => {
        if (err) return reject(err);
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
        if (err) return reject(err);
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
        if (err) return reject(err);
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
        if (err) return reject(err);
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
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });

export const getUser = (twitterId) => new Promise((resolve, reject) => {
  db.get(`SELECT ${GETINT("twitterId")}, lastFetchDate, recommendedFetchDate, ${GETINT("lastTweetId")} FROM twitterUsers WHERE twitterId = ?`, [twitterId], (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});
  
export const getAllUsers = () => new Promise((resolve, reject) => {
  db.all(`SELECT ${GETINT("twitterId")}, name, lastFetchDate, recommendedFetchDate, ${GETINT("lastTweetId")} FROM twitterUsers ORDER BY lastFetchDate ASC`, [], (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

export const updateRecommendedFetchDate = (twitterId, recommendedFetchDate) => new Promise((resolve, reject) => {
  db.run(
    "UPDATE twitterUsers SET recommendedFetchDate=? WHERE twitterId = ?",
    [recommendedFetchDate, twitterId],
    err => {
      if (err) return reject(err);
      resolve(0);
    });
});

export const updateUserData = (twitterId, lastFetchDate, recommendedFetchDate, lastTweetId) => new Promise((resolve, reject) => {
  db.run(
    "UPDATE twitterUsers SET lastFetchDate=?, recommendedFetchDate=?, lastTweetId=? WHERE twitterId = ?",
    [lastFetchDate, recommendedFetchDate, lastTweetId, twitterId],
    err => {
      if (err) return reject(err);
      resolve(0);
    }
  );
});

export const getUniqueChannels = () =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT ${GETINT("channelId")}, isDM FROM channels GROUP BY guildId`,
      [],
      (err, rows) => {
        if (err) return reject(err);
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
        if (err) return reject(err);
        resolve(row);
      }
    )
  );

export const createGuild = guildId =>
  new Promise((resolve, reject) =>
    db.run(
      `INSERT OR IGNORE INTO guilds(guildId) VALUES(?)`,
      [guildId],
      err => {
        if (err) return reject(err);
        resolve(1);
      }
    )
  );

export const rmGuild = guildId =>
  new Promise((resolve, reject) =>
    db.run(`DELETE FROM guilds WHERE guildId = ?`, [guildId], err => {
      if (err) return reject(err);
      resolve(1);
    })
  );

export const setLang = (guildId, lang) =>
  new Promise((resolve, reject) =>
    db.run(
      `INSERT OR REPLACE INTO guilds(guildId, lang) VALUES (?, ?)`,
      [guildId, lang],
      err => {
        if (err) return reject(err);
        resolve(0);
      }
    )
  );

export const getLang = guildId =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT lang FROM guilds WHERE guildId = ?`,
      [guildId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    )
  );

export const getGuildSubs = guildId =>
  new Promise((resolve, reject) =>
    db.all(
      `SELECT ${GETINT("subs.channelId", "channelId")}, ${GETINT(
        "subs.twitterId",
        "twitterId"
      )}, name, subs.isDM AS isDM, flags FROM subs INNER JOIN channels ON channels.channelId = subs.channelId INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId WHERE guildId = ?`,
      [guildId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    )
  );

export const getUserFromScreenName = name =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT ${GETINT("twitterId")} FROM twitterUsers WHERE name = ?`,
      [name],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });

export const getAllSubs = async () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT ${GETINT("subs.channelId", "channelId")}, ${GETINT(
        "twitterId"
      )}, subs.isDM AS isDM, flags FROM subs`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });



export const addChannel = async (channelId, guildId, ownerId, isDM) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO channels(channelId, guildId, ownerId, isDM) VALUES(?, ?, ?, ?)`,
      [channelId, guildId, ownerId, isDM],
      function(err) {
        if (err) return reject(err);
        resolve(this.changes !== 0 ? 1 : 0);
      }
    );
  });

// Return value: how many subs were created. If 0, sub was updated.
export const addSubscription = async (channelId, twitterId, flags, isDM) =>
  new Promise((resolve, reject) => {
    db.run(
      "INSERT OR IGNORE INTO subs(channelId, twitterId, flags, isDM) VALUES(?, ?, ?, ?)",
      [channelId, twitterId, flags, isDM],
      function(err) {
        if (err) return reject(err);
        if (this.changes !== 0) {
          resolve(1);
        } else {
          db.run(
            "UPDATE subs SET flags=? WHERE channelId = ? AND twitterId = ?",
            [flags, channelId, twitterId],
            err => {
              if (err) return reject(err);
              resolve(0);
            }
          );
        }
      }
    );
  });

export const addUser = (twitterId, name) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO twitterUsers(twitterId, name) VALUES(?, ?)`,
      [twitterId, name],
      function(err) {
        if (err) return reject(err);
        resolve(this.changes !== 0 ? 1 : 0);
      }
    );
  });

export const rmUser = twitterId =>
  new Promise((resolve, reject) =>
    db.run(`DELETE FROM twitterUsers WHERE twitterId = ?`, [twitterId], err => {
      if (err) return reject(err);
      resolve(1);
    })
  );

// Return value: How many subscriptions were deleted
export const removeSubscription = (channelId, twitterId) =>
  new Promise((resolve, reject) =>
    db.get(
      `SELECT 1 FROM subs WHERE twitterId=? AND channelId=?`,
      [twitterId, channelId],
      (err, row) => {
        if (err) return reject(err);
        else if (row === undefined) {
          resolve(0);
        } else {
          db.run(
            "DELETE FROM subs WHERE channelId = ? AND twitterId = ?",
            [channelId, twitterId],
            err => {
              if (err) return reject(err);
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
      if (err) return reject(err);
      resolve(1);
    })
  );