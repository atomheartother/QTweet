// logging
const log = require("./log");

// Modules
const discordEvents = require("./discordEvents");
const discord = require("./discord");
const dbl = require("./dbl");

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  console.error(err);
});

discordEvents.registerCallbacks();
discord.login();
dbl.registerClient();
