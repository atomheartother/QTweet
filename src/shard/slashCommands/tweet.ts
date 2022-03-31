import { getScreenName } from "../commands/helpers";
import { translated } from "../post";
import * as checks from "../commands/checks";
import log from "../../log";
import { postTimeline } from "../commands/tweet";
import {createSlashCommand, getBoolFlags} from "./utils";
import {SlashCommandDefinition, SlashCommand} from "./types";

const cmdDef : SlashCommandDefinition = {
  name: "tweet",
  description: "Post the latest tweet(s) from certain user(s).",
  options: [
    { name: "users", description: "The users' screen names, separated by spaces.", type: "string", required: true},
    { name: "retweets", description: "Count retweets as tweets.", type: "boolean" },
    { name: "reverse", description: "Order tweets from newest to oldest.", type: "boolean" },
    { name: "force", description: "Force the bot to post a lot of tweets.", type: "boolean" },
    { name: "notext", description: "Don't count text-only tweets, only count media tweets.", type: "boolean" },
    { name: "count", description: "The number of tweets you'd like to get from each account.", type: "number" }
  ]
}

const Tweet : SlashCommand = {
    data: createSlashCommand(cmdDef),
    function: async ({ qc, interaction }) => {
        const { user: author } = interaction;
        let force = false;
        const flags = getBoolFlags(cmdDef, interaction);
        const options: any = {};
        const countOpt = interaction.options.getNumber("count", false)
        options.count = countOpt ? Number(countOpt) : 1;

        const args = interaction.options.getString("users").split(" ");

        let screenNames = args.map(getScreenName);
        if (flags.indexOf("force") !== -1) force = true;
        const isMod = await checks.isChannelMod(author, qc);
        let count = options.count ? Number(options.count) : 1;
        if (!count || Number.isNaN(count)) {
            translated(qc, "countIsNaN", { count: options.count });
            return;
        }
        if (!count || Number.isNaN(count)) {
            translated(qc, "countIsNaN", { count: options.count });
            return;
        }
        const maxCount = 5;
        const aLot = 15;
        if (!isMod && count * screenNames.length > maxCount) {
            if (screenNames.length === 1) count = maxCount;
            else {
                screenNames = screenNames.slice(0, maxCount);
                count = Math.floor(maxCount / screenNames.length);
            }
            translated(qc, "tweetCountLimited", {
                maxCount: count * screenNames.length,
            });
        }
        if (count < 1) {
            translated(qc, "tweetCountUnderOne", { count });
            return;
        }
        if (count * screenNames.length >= aLot && !force) {
            log("Asked user to confirm", qc);
            translated(qc, "tweetCountHighConfirm", {
                screenName: screenNames.join(" "),
                count,
            });
            return;
        }
        screenNames.forEach((screenName: string) => postTimeline(qc, screenName, count, flags));
    },
}

export default Tweet;
