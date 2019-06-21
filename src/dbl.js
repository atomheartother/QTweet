import DBL from "dblapi.js";
import { getClient } from "./discord";
import * as pw from "../pw.json";
import log from "./log";

let dblClient = null;

export default () => {
  if (pw.DBLToken === null) {
    return null;
  }
  dblClient = new DBL(pw.DBLToken, getClient())
    .on("posted", () => {
      log("Posted DBL stats");
    })
    .on("error", ({ status }) => {
      log(`Error with DBL client: ${status}`);
    });
};
