import log from "./log";
import { login } from "./discord";

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  log(err);
});

login();
