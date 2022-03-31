import {SlashCommandBuilder} from "@discordjs/builders"
import {CommandInteraction} from "discord.js"
import {SlashCommandDefinition} from "./types"

export const createSlashCommand = (def: SlashCommandDefinition) => {
  const b = new SlashCommandBuilder()
      .setName(def.name)
      .setDescription(def.description)
  def.options.forEach(({ type, name, description, required}) => {
    if (type === 'number') {
      b.addNumberOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(!!required)
      )
    } else if (type === 'string') {
      b.addStringOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(!!required)
      )
    } else {
      b.addBooleanOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(!!required)
      )
    }
  })
  return b;
}

export const getBoolFlags = (cmdDef: SlashCommandDefinition, interaction: CommandInteraction): string[] =>
  cmdDef.options.reduce((acc, curr) => {
      if (!!curr.type && curr.type !== 'boolean') return acc;
      const opt = interaction.options.getBoolean(curr.name, false);
      if (opt && !curr.invert || !opt && curr.invert) {
        return [...acc, curr.name]
      }
      return acc;
    }, [])
