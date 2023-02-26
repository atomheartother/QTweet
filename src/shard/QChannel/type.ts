import { DMChannel, NewsChannel, TextChannel, ThreadChannel } from "discord.js"

export type QCType = 'DM' | 'GUILD_TEXT' | 'GUILD_NEWS' | 'GUILD_NEWS_THREAD' | 'GUILD_PUBLIC_THREAD' | 'GUILD_PRIVATE_THREAD';

export type QCSupportedChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel;

export type QCConstructor = {
    id: string;
    type: QCType;
    recipient?: { id: string }
}

export type QCSerialized = {
    channelId: string;
    isDM: boolean;
}
