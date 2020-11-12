import { Shard } from "discord.js";
import { QCSerialized } from "../shard/QChannel/type";

export const CMD_TWEET = 'tweet';
export const CMD_TWEETID = 'tweetId';
export const CMD_CRSTREAM = 'createStream';
export const CMD_START = 'start';
export const CMD_STOP = 'stop';
export const CMD_ANNOUNCE = 'announce';

export type ShardCmd = typeof CMD_TWEET | typeof CMD_TWEETID | typeof CMD_CRSTREAM | typeof CMD_START | typeof CMD_STOP | typeof CMD_ANNOUNCE

type TrCmd = {
    cmd: string;
    trCode: string;
    count?: number;
    name?: string;
}

export type DbModificationsInfo = {
    subs: number;
    users: number;
    channels?: number;
}

export type CmdTweet = {
    cmd: typeof CMD_TWEET;
    screen_name: string;
    tweet_type: string;
    qc: QCSerialized;
    flags: string[];
    count: number;
}

type MasterTweetResponse = any;

export type CmdTweetId = {
    cmd: typeof CMD_TWEETID;
    id: string;
    qc: QCSerialized;
}

type MasterTweetIdResponse = TrCmd | {
    isQuoted: boolean;
    formatted: any;
}

export type CmdCreateStream = {
    cmd: typeof CMD_CRSTREAM;
}

export type CmdStart = {
    cmd: typeof CMD_START;
    screenNames: string[];
    flags: number;
    // Needs a little extra info on this one
    qc: QCSerialized & { ownerId: string, guildId: string};
    msg?: string;
}

type MasterStartResponse = TrCmd | {
    data: any[];
    results: DbModificationsInfo[];
}

export type CmdStop = {
    cmd: typeof CMD_STOP;
    screenNames: string[];
    qc: QCSerialized;
}

type MasterStopResponse = TrCmd | DbModificationsInfo;

export type CmdAnnounce = {
    cmd: typeof CMD_ANNOUNCE;
    msg: string;
}

export type ShardMsg = CmdTweet | CmdTweetId | CmdCreateStream | CmdStart | CmdStop | CmdAnnounce;

type ShardMsgHandlerParam<T extends ShardCmd> =
    T extends typeof CMD_TWEET ? CmdTweet
    : T extends typeof CMD_TWEETID ? CmdTweetId
    : T extends typeof CMD_CRSTREAM ? CmdCreateStream
    : T extends typeof CMD_START ? CmdStart
    : T extends typeof CMD_STOP ? CmdStop
    : CmdAnnounce

type MasterShardResponse<T extends ShardCmd> =
    T extends typeof CMD_TWEET ? MasterTweetResponse
    : T extends typeof CMD_TWEETID ? MasterTweetIdResponse
    : T extends typeof CMD_CRSTREAM ? null
    : T extends typeof CMD_START ? MasterStartResponse
    : T extends typeof CMD_STOP ? MasterStopResponse
    : null;

export type MasterResponseMsg<T extends ShardCmd> = {
    cmd: T;
    qc?: QCSerialized;
    msg: ShardMsgHandlerParam<T>;
    res: MasterShardResponse<T>;
}

export type ShardMsgHandlerFunction<T extends ShardCmd> = (msg: ShardMsgHandlerParam<T>) => Promise<MasterShardResponse<T> | null>;