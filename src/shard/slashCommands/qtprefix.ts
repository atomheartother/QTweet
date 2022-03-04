import { setPrefix } from "../../db/guilds";
import { translated } from "../post";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("qtprefix")
        .setDescription("Changes the bot prefix for this server")
        .addStringOption(option => option.setName("prefix").setDescription("The new prefix").setRequired(true)),

    function: async ({ qc, interaction }) => {
        const prefix = interaction.options.getString("prefix", true);
        setPrefix(qc.guildId(), prefix);
        translated(qc, "prefixSuccess", { prefix });
    },
} as SlashCommand;
