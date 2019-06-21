const DBL = require("dblapi.js");
let dblClient = null;
const discord = require("./discord");
import * as pw from "../pw.json";
import log from "./log";

let dbl = (module.exports = {});

dbl.registerClient = () => {
  if (pw.DBLToken === null) {
    return;
  }
  dblClient = new DBL(pw.DBLToken, discord.getClient()).on(
    "error",
    ({ status }) => {
      log(`Error with DBL client: ${status}`);
    }
  );
};
