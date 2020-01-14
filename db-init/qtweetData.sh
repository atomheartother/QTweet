#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
CREATE TABLE twitterUsers (
    twitterId integer PRIMARY KEY,
    name text
);
CREATE TABLE subs (
    twitterId integer,
    channelId integer,
    isDM integer NOT NULL,
    flags integer NOT NULL,
    CONSTRAINT sub_key PRIMARY KEY(twitterId, channelId)
);

CREATE TABLE guilds (
    guildId     integer PRIMARY KEY,
    lang        text NOT NULL DEFAULT '${DEFAULT_LANG}'
);

CREATE TABLE channels (
    channelId   integer PRIMARY KEY,
    ownerId     integer NOT NULL,
    guildId     integer NOT NULL,
    isDM        integer NOT NULL DEFAULT 0
);
EOSQL