import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";
import { cmd } from "../master";

export default {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Posts an announcement to every guild this bot is currently posting in.")
        .addStringOption(option => option.setName("msg").setDescription("The message to announce").setRequired(true)),

    function: async ({ interaction }) => {
        const msg = interaction.options.getString("msg", true);
        cmd("announce", { msg });
    },
} as SlashCommand;
