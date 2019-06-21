// logging
import log from "./log";

// Modules
import registerCallbacks from "./discordEvents";
const discord = require("./discord");
const dbl = require("./dbl");

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  console.error(err);
});

registerCallbacks();
discord.login();
dbl.registerClient();
