import { MessageEmbed } from "discord.js";
import i18n from "../i18n";
import { embed } from "../post";
import { getGuildInfo } from "../../db/guilds";
import process from 'process'
import {SlashCommand} from "./types";
import {SlashCommandBuilder} from "@discordjs/builders";

const Help: SlashCommand = {
  data: new SlashCommandBuilder().setName("help").setDescription("Posts a simple help message with some basic command usage."),
  function: async ({ qc }) => {
    const { lang: language } = await getGuildInfo(qc.guildId());
    const helpMsg = new MessageEmbed()
      .setColor(0x0e7675)
      .setTitle(i18n(language, 'helpHeader'))
      .setURL(process.env.PROFILE_URL)
      .setDescription(i18n(language, 'helpIntro'))
      .addField(`/tweet`, i18n(language, 'usage-tweet'))
      .addField(`/start`, i18n(language, 'usage-start'))
      .addField(`/stop`, i18n(language, 'usage-stop'))
      .addField(`/lang`, i18n(language, 'usage-lang'))
      .addField(`/list`, i18n(language, 'usage-list'))
      .setFooter({ text: i18n(language, 'helpFooter', { artist: 'ryusukehamamoto' }) });
    embed(qc, { embeds: [helpMsg] });
  },
};

export default Help;
