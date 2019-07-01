import log from "./log";
import { login, getClient } from "./discord";
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

getClient()
  .on("message", handleMessage)
  .on("error", handleError)
  .on("guildCreate", handleGuildCreate)
  .on("guildDelete", handleGuildDelete)
  .on("ready", handleReady)
  .on("channelDelete", handleChannelDelete);

login();
