import { Pool } from 'pg';
import log from './log';

let pool;

export const init = () => {
  pool = new Pool();
};

export const close = async () => {
  await pool.end();
  log('Database cleared');
};

const getInt = (val, alias = val) => `${val}::text AS ${alias}`;

// Get all subscriptions
export const getAllSubs = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('subs."channelId"', '"channelId"')}, ${getInt(
    '"twitterId"',
  )}, subs."isDM" AS "isDM", "flags" FROM subs`);
  return rows;
};

export const sanityCheck = async () => {
  const client = await pool.connect();
  let channels = 0;
  let guilds = 0;
  let users = 0;
  try {
    await client.query('BEGIN');
    // Remove channels that are linked to no subs
    ({ rowCount: channels } = await client.query(`DELETE FROM channels
    WHERE NOT EXISTS (
      SELECT FROM subs
      WHERE  subs."channelId" = channels."channelId"
    );`));
    // Remove guilds that are linked to no channels.
    ({ rowCount: guilds } = await client.query(`DELETE FROM guilds
    WHERE NOT EXISTS (
      SELECT FROM channels
      WHERE  channels."guildId" = guilds."guildId"
    );`));
    // Remove users that are linked to no subs
    ({ rowCount: users } = await client.query(`DELETE FROM twitterUsers
    WHERE NOT EXISTS (
      SELECT FROM subs
      WHERE  twitterUsers."twitterId" = subs."twitterId"
    );`));
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
  return { users, channels, guilds };
};

// Subscription management
export const addSubscription = async (channelId, twitterId, flags, isDM) => {
  const { rows: [{ case: inserted }] } = await pool.query(`
  INSERT INTO 
    subs("channelId", "twitterId", "flags", "isDM")
  VALUES($1, $2, $3, $4)
    ON CONFLICT ON CONSTRAINT sub_key
  DO UPDATE SET "flags"=$3
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [channelId, twitterId, flags, isDM]);
  return inserted;
};

export const removeSubscription = async (channelId, twitterId) => {
  const { rowCount } = await pool.query('DELETE FROM subs WHERE "channelId" = $1 AND "twitterId" = $2', [channelId, twitterId]);
  return rowCount;
};

export const getSubscription = async (channelId, twitterId, withName = false) => {
  const { rows: [subscription] } = await pool.query(withName
    ? `SELECT ${getInt('subs."channelId"', '"channelId"')}, ${getInt(
      'subs."twitterId"',
      '"twitterId"',
    )}, "name", "flags", "isDM" FROM subs INNER JOIN twitterUsers ON subs."twitterId" = twitterUsers."twitterId" WHERE subs."channelId" = $1 AND subs."twitterId" = $2`
    : `SELECT ${getInt('"channelId"')}, ${getInt(
      '"twitterId"',
    )}, "flags", "isDM" FROM subs WHERE "channelId" = $1 AND "twitterId" = $2`);
  return subscription;
};

export const getGuildSubs = async (guildId) => {
  const { rows } = await pool.query(`
  SELECT 
    ${getInt('subs."channelId"', '"channelId"')},
    ${getInt('subs."twitterId"', '"twitterId"')},
    "name",
    subs."isDM" AS "isDM",
    "flags"
  FROM subs
  INNER JOIN channels ON channels."channelId" = subs."channelId" INNER JOIN twitterUsers ON subs."twitterId" = twitterUsers."twitterId"
  WHERE "guildId" = $1`,
  [guildId]);
  return rows;
};

export const getChannelSubs = async (channelId, withName = false) => {
  const res = await pool.query(withName
    ? `SELECT ${getInt(
      'subs."twitterId"',
      '"twitterId"',
    )},
    "name",
    "flags"
    FROM subs INNER JOIN twitterUsers ON subs."twitterId" = twitterUsers."twitterId"
    WHERE subs."channelId"=$1`
    : `SELECT ${getInt(
      '"twitterId"',
    )}, "flags" FROM subs WHERE subs."channelId"=$1`,
  [channelId]);
  return res.rows;
};

export const getUserSubs = async (twitterId, withInfo = false) => {
  const { rows } = await pool.query(
    withInfo
      ? `SELECT ${getInt('subs."channelId"', '"channelId"')}, "flags", ${getInt(
        '"guildId"',
      )}, ${getInt(
        '"ownerId"',
      )}, "subs."isDM"" AS "isDM" FROM subs INNER JOIN channels ON subs."channelId" = channels."channelId" WHERE subs."twitterId"=$1;`
      : `SELECT ${getInt(
        '"channelId"',
      )}, "flags", "isDM" FROM subs WHERE "twitterId"=$1`, [twitterId],
  );
  return rows;
};

// Channel actions

export const getChannel = async (channelId) => {
  const { rows: [channel] } = await pool.query('SELECT * FROM channels WHERE "channelId" = $1', [channelId]);
  return channel;
};

export const addChannel = async (channelId, guildId, ownerId, isDM) => {
  const { rowCount } = await pool.query('INSERT INTO channels("channelId", "guildId", "ownerId", "isDM") VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [channelId, guildId, ownerId, isDM]);
  return rowCount;
};

export const rmChannel = async (channelId) => {
  const { rowCount } = await pool.query('DELETE FROM channels WHERE "channelId" = $1', [channelId]);
  return rowCount;
};

export const getGuildChannels = async (guildId) => {
  const { rows } = await pool.query(`SELECT ${getInt('"channelId"')} FROM channels WHERE "guildId" = $1`, [guildId]);
  return rows;
};

export const getUniqueChannels = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('"channelId"')}, "isDM" FROM channels GROUP BY "channelId", "guildId"`);
  return rows;
};

// Twitter user actions
export const getUserIds = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('"twitterId"')} FROM twitterUsers`);
  return rows;
};

export const getUserInfo = async (twitterId) => {
  const { rows: [info] } = await pool.query('SELECT "name" FROM twitterUsers WHERE "twitterId" = $1', [twitterId]);
  return info;
};

export const addUser = async (twitterId, name) => {
  const { rowCount } = await pool.query('INSERT INTO twitterUsers("twitterId", "name") VALUES($1, $2) ON CONFLICT DO NOTHING', [twitterId, name]);
  return rowCount;
};

export const getUserFromScreenName = async (name) => {
  const { rows: [user] } = await pool.query(`SELECT ${getInt('"twitterId"')} FROM twitterUsers WHERE "name" = $1`, [name]);
  return user;
};

export const rmUser = async (twitterId) => {
  const { rowCount } = await pool.query('DELETE FROM twitterUsers WHERE "twitterId" = $1', [twitterId]);
  return rowCount;
};

// Guild actions
export const createGuild = async (guildId) => {
  const { rowCount } = await pool.query('INSERT INTO guilds("guildId") VALUES($1) ON CONFLICT DO NOTHING',
    [guildId]);
  return rowCount;
};

export const rmGuild = async (guildId) => {
  const { rowCount } = await pool.query('DELETE FROM guilds WHERE "guildId" = $1', [guildId]);
  return rowCount;
};

export const setLang = async (guildId, lang) => {
  const { rows: [{ case: inserted }] } = await pool.query(`INSERT INTO guilds("guildId", "lang")
  VALUES($1, $2)
  ON CONFLICT("guildId") DO
    UPDATE SET "lang"=$2
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [guildId, lang]);
  return inserted;
};

export const getLang = async (guildId) => {
  const { rows: [lang] } = await pool.query('SELECT "lang" FROM guilds WHERE "guildId"=$1', [guildId]);
  return lang;
};
