CREATE TABLE twitterUsers (
    "twitterId" BIGINT PRIMARY KEY,
    "name" text
);

CREATE TABLE guilds (
    "guildId"     BIGINT PRIMARY KEY,
    "prefix"      text DEFAULT NULL,
    "lang"        text DEFAULT NULL
);

CREATE TABLE channels (
    "channelId"   BIGINT PRIMARY KEY,
    "ownerId"     BIGINT NOT NULL,
    "guildId"     BIGINT REFERENCES guilds ON DELETE CASCADE,
    "isDM"        boolean NOT NULL DEFAULT false
);

CREATE TABLE subs (
    "twitterId" BIGINT REFERENCES twitterUsers ON DELETE CASCADE,
    "channelId" BIGINT REFERENCES channels ON DELETE CASCADE,
    "isDM" boolean NOT NULL,
    "flags" integer NOT NULL,
    "msg" text DEFAULT NULL,
    CONSTRAINT sub_key PRIMARY KEY("twitterId", "channelId")
);