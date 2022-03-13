import { getInt, pool, sanityCheck } from "./index";
import { createGuild } from "./guilds";

export type DbChannel = {
  channelId: string;
  ownerId: string;
  guildId: string;
  isDM: boolean;
}

export const getChannel = async (channelId: string): Promise<DbChannel | undefined> => {
    const { rows: [channel] } = await pool.query('SELECT * FROM channels WHERE "channelId" = $1', [channelId]);
    return channel;
  };

const addChannelSQL = async (channelId: string, guildId: string, ownerId: string, isDM: boolean) => {
  const { rowCount } = await pool.query('INSERT INTO channels("channelId", "guildId", "ownerId", "isDM") VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [channelId, guildId, ownerId, isDM]);
  return rowCount;
};

export const addChannel = async (channelId: string, guildId: string, ownerId: string, isDM: boolean) => {
  await createGuild(guildId);
  if (isDM) {
    return addChannelSQL(channelId, channelId, channelId, isDM);
  }
  return addChannelSQL(channelId, guildId, ownerId, isDM);
};

const rmChannelSQL = async (channelId: string) => {
  const { rowCount } = await pool.query('DELETE FROM channels WHERE "channelId" = $1', [channelId]);
  return rowCount;
};

export const rmChannel = async (channelId: string) => {
  const channels = await rmChannelSQL(channelId);
  const { users } = await sanityCheck();
  return { channels, users };
};

export const getGuildChannels = async (guildId: string): Promise<DbChannel[]> => {
  const { rows } = await pool.query(`SELECT ${getInt('"channelId"')} FROM channels WHERE "guildId" = $1`, [guildId]);
  return rows;
};

export const getChannels = async (): Promise<DbChannel[]> => {
  const { rows } = await pool.query('SELECT * FROM channels');
  return rows;
};

export const getUniqueChannels = async (): Promise<DbChannel[]> => {
  const { rows } = await pool.query(`SELECT ${getInt('MIN("channelId")', '"channelId"')}, BOOL_OR("isDM") AS "isDM" FROM channels GROUP BY "guildId"`);
  return rows;
};
  
