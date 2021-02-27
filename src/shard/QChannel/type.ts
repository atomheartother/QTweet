import { DMChannel, NewsChannel, TextChannel } from "discord.js"

export type QCType = 'dm' | 'text' | 'news';

export type QCSupportedChannel = TextChannel | DMChannel | NewsChannel;

export type QCConstructor = {
    id: string;
    type: QCType;
    recipient?: { id: string }
}

export type QCSerialized = {
    channelId: string;
    isDM: boolean;
}