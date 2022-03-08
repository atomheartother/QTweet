import { MessageEmbed } from "discord.js";
import i18n from "../i18n";
import { embed } from "../post";
import { CmdFn } from ".";
import { getGuildInfo } from "../../db/guilds";
import process from 'process'

const help : CmdFn = async (_, qChannel) => {
    const { lang: language, prefix } = await getGuildInfo(qChannel.guildId());
    const helpMsg = new MessageEmbed()
      .setColor(0x0e7675)
      .setTitle(i18n(language, 'helpHeader'))
      .setURL(process.env.PROFILE_URL)
      .setDescription(i18n(language, 'helpIntro'))
      .addField(`${prefix}tweet`, i18n(language, 'usage-tweet'))
      .addField(`${prefix}start`, i18n(language, 'usage-start'))
      .addField(`${prefix}stop`, i18n(language, 'usage-stop'))
      .addField(`${prefix}lang`, i18n(language, 'usage-lang'))
      .addField(`${prefix}list`, i18n(language, 'usage-list'))
      .setFooter({ text: i18n(language, 'helpFooter', { artist: 'ryusukehamamoto' })});
    embed(qChannel, { embeds: [helpMsg] });
};

export default help;
