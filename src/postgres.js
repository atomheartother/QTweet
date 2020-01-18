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
  const { rows } = await pool.query(`SELECT ${getInt('subs.channelId', 'channelId')}, ${getInt(
    'twitterId',
  )}, subs.isDM AS isDM, flags FROM subs`);
  return rows;
};


// Subscription management
export const addSubscription = async (channelId, twitterId, flags, isDM) => {
  const { rows: [{ case: inserted }] } = await pool.query(`
  INSERT INTO 
    subs(channelId, twitterId, flags, isDM)
  VALUES($1, $2, $3, $4)
    ON CONFLICT ON CONSTRAINT sub_key
  DO UPDATE SET flags=$3
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [channelId, twitterId, flags, isDM]);
  return inserted;
};

export const removeSubscription = async () => 0;

export const getSubscription = async () => 0;

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
  const res = await pool.query(withName
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
  return res.rows;
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

// Channel actions

export const addChannel = async () => 0;

export const rmChannel = async () => 0;

export const getGuildChannels = async () => 0;

export const getUniqueChannels = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('channelId')}, isDM FROM channels GROUP BY guildId`);
  return rows;
};

// Twitter user actions
export const getUserIds = async () => {
  const { rows } = await pool.query(`SELECT ${getInt('twitterId')} FROM twitterUsers`);
  return rows;
};

export const getUserInfo = async (twitterId) => {
  const { rows } = await pool.query('SELECT name FROM twitterUsers WHERE twitterId = $1', [twitterId]);
  return rows;
};

export const addUser = async () => 0;

export const getUserFromScreenName = async () => 0;

export const rmUser = async () => 0;

// Lang actions
export const setLang = async () => 0;

export const getLang = async () => 0;
