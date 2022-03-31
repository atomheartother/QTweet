import {SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Client} from "../discord/clientType";
import QChannel from "../QChannel/QChannel";

export type SlashCmdBuilder = Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder;

export type SlashCommand = {
  data: SlashCmdBuilder
  function: (params: { client: Client; interaction: CommandInteraction; qc: QChannel }) => void | Promise<void>;
}

export type Option = {
  name: string
  description: string
  type?: 'boolean' | 'number' | 'string'
  required?: boolean
  invert?: boolean
}

export type SlashCommandDefinition = {
  name: string
  description: string
  options: Option[]
}
