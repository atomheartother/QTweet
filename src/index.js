import log from "./log";
import { login } from "./discord";

process.on("unhandledRejection", function(err) {
  log("Unhandled exception:");
  console.error(err);
});

const start = async () => {
  try {
    await login();
  } catch (e) {
    log("Error logging into Discord:");
    log(e);
  }
};

start();
