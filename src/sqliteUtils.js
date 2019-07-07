import { login, getClient } from "./discord";
import { load, collection } from "./subs";
import { serialize } from "./flags";

import SQLite3 from "sqlite3";
const sqlite3 = SQLite3.verbose();

getClient().on("ready", () => {
  load(() => {
    const db = new sqlite3.Database("./data/qtweetData.db", err => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Connected to SQlite database.");
    });
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS twitterUsers(twitterId INTEGER PRIMARY KEY, name TEXT)`,
        err => {
          if (err) {
            console.log("Error creating twitterUsers table");
            console.log(err);
          }
        }
      )
        .run(
          `CREATE TABLE IF NOT EXISTS subs(twitterId INTEGER, channelId INTEGER, isDM INTEGER NOT NULL, flags INTEGER NOT NULL, PRIMARY KEY(twitterId, channelId))`,
          err => {
            if (err) {
              console.log("Error creating subs table");
              console.log(err);
            }
          }
        )
        .run(
          `CREATE TABLE IF NOT EXISTS channels(channelId INTEGER PRIMARY KEY, ownerId INTEGER NOT NULL, guildId INTEGER NOT NULL, isDM INTEGER NOT NULL)`,
          err => {
            if (err) {
              console.log("Error creating channels table");
              console.log(err);
            }
          }
        );
      const channels = {};
      const usersStmt = db.prepare(
        `INSERT INTO twitterUsers(twitterId, name) VALUES(?, ?)`
      );
      Object.keys(collection).forEach(twitterId => {
        const { name } = collection[twitterId];
        usersStmt.run([twitterId, name]);
      });
      usersStmt.finalize(err => {
        if (err) {
          console.log(`Error adding twitter users to twitterUsers`);
          console.error(err);
          return;
        }
        const stmt = db.prepare(
          `INSERT INTO subs(twitterId, channelId, isDM, flags) VALUES (?, ?, ?, ?)`
        );
        Object.keys(collection).forEach(twitterId => {
          const { subs } = collection[twitterId];
          subs.forEach(({ qChannel, flags }) => {
            if (!channels[qChannel.id]) {
              channels[qChannel.id] = {
                id: qChannel.id,
                oid: qChannel.oid,
                gid: qChannel.gid,
                isDM: qChannel.isDM ? 1 : 0
              };
            }
            stmt.run([
              twitterId,
              qChannel.id,
              qChannel.isDM ? 1 : 0,
              serialize(flags)
            ]);
          });
        });
        stmt.finalize(err => {
          if (err) {
            console.error(err);
            return;
          }
          const stmt = db.prepare(
            "INSERT INTO channels(channelId, ownerId, guildId, isDM) VALUES(?,?,?,?)"
          );
          console.log(`Saving ${Object.keys(channels).length} channels`);
          Object.keys(channels).forEach(channelId => {
            const { id, oid, gid, isDM } = channels[channelId];
            stmt.run([id, oid, gid, isDM]);
          });
          stmt
            .finalize(err => {
              if (err) {
                console.log(`Error saving channels`);
                console.log(err);
              }
            })
            .close(err => {
              if (err) {
                console.log("Error closing db");
                console.log(err);
                return;
              }
              console.log("Database closed successfully");
            });
        });
      });
    });
  });
});

login();
