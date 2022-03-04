import { getLang, setLang } from "../../db/guilds";
import { formatLanguages, FORMAT_POST_EMBEDS } from "../format";
import { supportedLangs } from "../../../config.json";
import { embeds, translated } from "../post";
import log from "../../log";
import { SlashCommand } from "../discord/clientType";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
    data: new SlashCommandBuilder()
        .setName("lang")
        .setDescription("Changes the bot language")
        .addSubcommand(sub => sub.setName("list").setDescription("Lists all available languages"))
        .addSubcommand(sub =>
            sub
                .setName("set")
                .setDescription("Changes the bot language")
                .addStringOption(option => {
                    option.setName("language").setDescription("The language to switch to");
                    let choices: any[];
                    supportedLangs.forEach(lang => choices.push([lang, lang]));
                    return option.addChoices(choices);
                })
        ),

    function: async ({ interaction, qc }) => {
        const verb = interaction.options.getSubcommand();

        if (verb == "list") {
            const gid = qc.guildId();
            const language = await getLang(gid);
            const res = await formatLanguages(qc.serialize(), supportedLangs, language);
            if (res.cmd === FORMAT_POST_EMBEDS) {
                embeds(qc, res.embeds);
            }
        } else if (verb == "set") {
            const language = interaction.options.getString("language");

            await setLang(qc.guildId(), language);
            translated(qc, "langSuccess");
            log(`Changed language to ${language}`, qc);
        }
    },
} as SlashCommand;
