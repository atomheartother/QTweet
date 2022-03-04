import QChannel from "../QChannel/QChannel";
import { embed as postEmbed } from "../post";
import log from "../../log";
import { cmd } from "../master";
import { CmdFn } from "../commands";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("tweetid")
        .setDescription("Post the formatted tweet with the specified ID.")
        .addStringOption(option => option.setName("id").setDescription("The tweet ID").setRequired(true)),
    function: async ({ qc, interaction }) => {
        cmd("tweetId", { id: interaction.options.getString("id"), qc: qc.serialize() });
    },
} as SlashCommand;
