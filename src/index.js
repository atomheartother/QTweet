import log from "./log";
import { login, getClient } from "./discord";
import { open as openDb, close as closeDb } from "./sqlite";
import {
  handleMessage,
  handleError,
  handleGuildCreate,
  handleGuildDelete,
  handleReady,
  handleChannelDelete
} from "./discordEvents";

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  log(err);
});

process.on("exit", closeDb);
process.on("SIGINT", closeDb);
process.on("SIGKILL", closeDb);
process.on("SIGQUIT", closeDb);

const start = async () => {
  await openDb();
  // Register discord handles
  getClient()
    .on("message", handleMessage)
    .on("error", handleError)
    .on("guildCreate", handleGuildCreate)
    .on("guildDelete", handleGuildDelete)
    .on("ready", handleReady)
    .on("channelDelete", handleChannelDelete);
  // Login
  login();
};

start();
