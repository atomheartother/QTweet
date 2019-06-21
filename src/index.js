// logging
import log from "./log";
import dbl from "./dbl";
// Modules
import registerCallbacks from "./discordEvents";
import { login } from "./discord";

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  console.error(err);
});

registerCallbacks();
login();
dbl();
