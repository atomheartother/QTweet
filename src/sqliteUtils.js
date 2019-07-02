import { login, getClient } from "./discord";
import { load, collection } from "./subs";
import SQLite3 from "sqlite3";
const sqlite3 = SQLite3.verbose();

getClient().on("ready", () => {
  load(() => {
    console.log(Object.keys(collection).length);
    const db = new sqlite3.Database("./data/qtweetData.db", err => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Connected to the in-memory SQlite database.");
      // close the database connection
    });
    db.close(err => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Close the database connection.");
    });
  });
});

login();
