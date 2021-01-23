import { DMChannel, TextChannel } from "discord.js"

export type QCType = 'dm' | 'text'

export type QCSupportedChannel = TextChannel | DMChannel;

export type QCConstructor = {
    id: string;
    type: QCType;
    recipient?: { id: string }
}

export type QCSerialized = {
    channelId: string;
    isDM: boolean;
}