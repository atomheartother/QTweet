import { cmd } from "../master";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

const TweetId : SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("tweetid")
        .setDescription("Post the formatted tweet with the specified ID.")
        .addStringOption(option => option.setName("id").setDescription("The tweet ID").setRequired(true)),
    function: async ({ qc, interaction }) => {
        cmd("tweetId", { id: interaction.options.getString("id"), qc: qc.serialize() });
    },
}

export default TweetId;
