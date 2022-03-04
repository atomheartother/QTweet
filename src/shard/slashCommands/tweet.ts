import { getScreenName } from "../commands/helpers";
import { translated } from "../post";
import * as checks from "../commands/checks";
import log from "../../log";
import { postTimeline } from "../commands/tweet";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("tweet")
        .setDescription("Get the latest tweet from a twitter user and post it in this channel.")
        .addStringOption(option => option.setName("users").setDescription("The users @"))
        .addStringOption(option =>
            option.setName("flags").setDescription("The flags to use. Check the docs for more information").setRequired(false)
        ),
    function: async ({ qc, interaction }) => {
        const { user: author } = interaction;
        let force = false;
        const flags = interaction.options.getString("flags").split(" ");
        const options: any = {};
        options.count = flags.find(flag => flag.includes("--count"));
        options.count = options.count ? Number(options.count) : 1;

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
} as SlashCommand;
