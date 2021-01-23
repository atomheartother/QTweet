import { pool, sanityCheck } from ".";

type DbGuild = {
  guildId: string;
  prefix: string;
  lang: string
}

export const createGuild = async (guildId: string) => {
    const { rowCount } = await pool.query('INSERT INTO guilds("guildId") VALUES($1) ON CONFLICT DO NOTHING',
      [guildId]);
    return rowCount;
  };

const rmGuildSQL = async (guildId: string) => {
  let guilds = 0;
  ({ rowCount: guilds } = await pool.query('DELETE FROM guilds WHERE "guildId" = $1', [guildId]));
  return { guilds };
};

export const rmGuild = async (guildId: string) => {
  const { guilds } = await rmGuildSQL(guildId);
  const { channels, users } = await sanityCheck();
  return { channels, users, guilds };
};

export const setLang = async (guildId: string, lang: string) => {
  const { rows: [{ case: inserted }] } = await pool.query<{case: number}>(`INSERT INTO guilds("guildId", "lang")
  VALUES($1, $2)
  ON CONFLICT("guildId") DO
    UPDATE SET "lang"=$2
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [guildId, lang]);
  return inserted;
};

const getLangSQL = async (guildId: string) => {
  const { rows: [lang] } = await pool.query<{lang: string}>('SELECT "lang" FROM guilds WHERE "guildId"=$1', [guildId]);
  return lang;
};

export const getLang = async (guildId: string) => {
  const guild = await getLangSQL(guildId);
  return guild ? guild.lang : process.env.DEFAULT_LANG;
};

export const setPrefix = async (guildId: string, prefix: string) => {
  const { rows: [{ case: inserted }] } = await pool.query<{case: number}>(`INSERT INTO guilds("guildId", "prefix")
  VALUES($1, $2)
  ON CONFLICT("guildId") DO
    UPDATE SET "prefix"=$2
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [guildId, prefix]);
  return inserted;
};

const getGuildInfoSQL = async (guildId: string): Promise<DbGuild | undefined> => {
  const { rows: [data] } = await pool.query<DbGuild>('SELECT * FROM guilds WHERE "guildId"=$1 LIMIT 1', [guildId]);
  return data;
};

export const getGuildInfo = async (guildId: string) => {
  const data = await getGuildInfoSQL(guildId);
  const prefix = (data && data.prefix) || process.env.PREFIX;
  const lang = (data && data.lang) || process.env.DEFAULT_LANG;
  return { prefix, lang };
};