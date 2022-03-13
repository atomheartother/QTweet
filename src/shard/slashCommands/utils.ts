import {SlashCommandBuilder} from "@discordjs/builders"
import {SlashCommandDefinition} from "./types"

export const createSlashCommand = (def: SlashCommandDefinition) => {
  const b = new SlashCommandBuilder()
      .setName(def.name)
      .setDescription(def.description)
  def.options.forEach(({ type, name, description }) => {
    if (type === 'number') {
      b.addNumberOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(false)
      )
    } else if (type === 'string') {
      b.addStringOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(false)
      )
    } else {
      b.addBooleanOption(opt => opt
        .setName(name)
        .setDescription(description)
        .setRequired(false)
      )
    }
  })
  return b;
}
