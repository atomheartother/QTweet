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
      console.log("Connected to the in-memory SQlite database.");
      // close the database connection
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
      ).run(
        `CREATE TABLE IF NOT EXISTS subs(twitterId INTEGER, channelId INTEGER, isDM INTEGER NOT NULL, flags INTEGER NOT NULL, PRIMARY KEY(twitterId, channelId))`,
        err => {
          if (err) {
            console.log("Error creating subs table");
            console.log(err);
          }
        }
      );
      Object.keys(collection).forEach(twitterId => {
        const { name, subs } = collection[twitterId];
        db.run(
          `INSERT INTO twitterUsers(twitterId, name) VALUES(?, ?)`,
          [twitterId, name],
          err => {
            if (err) {
              console.error(err);
            }
          }
        );
        const stmt = db.prepare(
          `INSERT INTO subs(twitterId, channelId, isDM, flags) VALUES (?, ?, ?, ?)`
        );
        subs.forEach(({ qChannel, flags }) => {
          stmt.run([
            twitterId,
            qChannel.id,
            qChannel.type === "dm" ? 1 : 0,
            serialize(flags)
          ]);
        });
        stmt.finalize(err => {
          if (err) {
            console.error(err);
          }
        });
      });
      db.close(err => {
        if (err) {
          return console.error(err.message);
        }
        console.log("Close the database connection.");
      });
    });
  });
});

login();
