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

const getInt = (val, alias = val) => `CAST(${val} AS text) AS ${alias}`;

/*
 * pool.query('SELECT * FROM users WHERE id = $1', [1], (err, res) => {
 *   if (err) {
 *     throw err
 *   }
 *   console.log('user:', res.rows[0])
 * });
 */

// Get all subscriptions
export const getAllSubs = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('subs.channelId', 'channelId')}, ${getInt(
    'twitterId',
  )}, subs.isDM AS isDM, flags FROM subs`);
  return rows;
};

// Various getters, some might seem a bit complicated,
// they usually let you get things from another thing
export const getUserIds = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('twitterId')} FROM twitterUsers`);
  return rows;
};

export const getUserSubs = async (twitterId, withInfo = false) => {
  const { rows } = await pool.query(
    withInfo
      ? `SELECT ${getInt('subs.channelId', 'channelId')}, flags, ${getInt(
        'guildId',
      )}, ${getInt(
        'ownerId',
      )}, subs.isDM AS isDM FROM subs INNER JOIN channels ON subs.channelId = channels.channelId WHERE subs.twitterId=$1;`
      : `SELECT ${getInt(
        'channelId',
      )}, flags, isDM FROM subs WHERE twitterId=$1`, [twitterId],
  );
  return rows;
};

export const getUniqueChannels = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('channelId')}, isDM FROM channels GROUP BY guildId`);
  return rows;
};

export const getUserInfo = async (twitterId) => {
  const { rows } = await pool.query('SELECT name FROM twitterUsers WHERE twitterId = $1', [twitterId]);
  return rows;
};

export const getGuildSubs = async (guildId) => {
  const { rows } = await pool.query(`SELECT ${getInt('subs.channelId', 'channelId')}, ${getInt('subs.twitterId', 'twitterId')},
    name,
    subs.isDM AS isDM,
    flags FROM subs
    INNER JOIN channels ON channels.channelId = subs.channelId INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId
    WHERE guildId = $1`,
  [guildId]);
  return rows;
};

export const getChannelSubs = async (channelId, withName = false) => {
  const { rows } = await pool.query(withName
    ? `SELECT ${getInt(
      'subs.twitterId',
      'twitterId',
    )},
    name,
    flags
    FROM subs INNER JOIN twitterUsers ON subs.twitterId = twitterUsers.twitterId
    WHERE subs.channelId=$1`
    : `SELECT ${getInt(
      'twitterId',
    )}, flags FROM subs WHERE subs.channelId=$1`,
  [channelId]);
  return rows;
};

export const rmChannel = async () => 0;

export const getSubscription = async () => 0;

export const getUserFromScreenName = async () => 0;

export const rmUser = async () => 0;

export const addSubscription = async () => 0;

export const removeSubscription = async () => 0;

export const addChannel = async () => 0;

export const addUser = async () => 0;

export const getGuildChannels = async () => 0;

export const setLang = async () => 0;

export const getLang = async () => 0;
