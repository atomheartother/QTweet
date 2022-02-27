import { DMChannel, NewsChannel, TextChannel } from "discord.js"

export type QCType = 'DM' | 'GUILD_TEXT' | 'GUILD_NEWS';

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
