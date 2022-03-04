import { CmdFn } from "../commands";
import { cmd } from "../master";
import { translated } from "../post";
import { getScreenName } from "../commands/helpers";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Causes QTweet to stop sending you tweets from this particular user.")
        .addStringOption(option =>
            option.setName("users").setDescription("The users to stop getting tweets from, separated by space.").setRequired(true)
        ),

    function: async ({ interaction, qc }) => {
        const screenNames = interaction.options.getString("users").split(" ").map(getScreenName);
        if (screenNames.length < 1) {
            translated(qc, "usage-stop");
            return;
        }
        cmd("stop", { screenNames, qc: qc.serialize() });
    },
} as SlashCommand;

const stop: CmdFn = async ({ args }, qChannel) => {
    const screenNames = args.map(getScreenName);
    if (screenNames.length < 1) {
        translated(qChannel, "usage-stop");
        return;
    }
    cmd("stop", { screenNames, qc: qChannel.serialize() });
};
