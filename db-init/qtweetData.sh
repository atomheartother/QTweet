#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
CREATE TABLE twitterUsers (
    "twitterId" BIGINT PRIMARY KEY,
    "name" text
);

CREATE TABLE subs (
    "twitterId" BIGINT,
    "channelId" BIGINT,
    "isDM" boolean NOT NULL,
    "flags" integer NOT NULL,
    CONSTRAINT sub_key PRIMARY KEY("twitterId", "channelId")
);

CREATE TABLE guilds (
    "guildId"     BIGINT PRIMARY KEY,
    "lang"        text NOT NULL DEFAULT '${DEFAULT_LANG}'
);

CREATE TABLE channels (
    "channelId"   BIGINT PRIMARY KEY,
    "ownerId"     BIGINT NOT NULL,
    "guildId"     BIGINT NOT NULL,
    "isDM"        boolean NOT NULL DEFAULT false
);
EOSQL