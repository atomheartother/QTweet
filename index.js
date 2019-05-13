// logging
const log = require("./log");

// Modules
const discordEvents = require("./discordEvents");
const discord = require("./discord");

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  console.error(err);
});

discordEvents.registerCallbacks();
discord.login();
