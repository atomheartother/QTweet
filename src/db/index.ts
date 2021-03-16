import { Pool } from 'pg';
import log from '../log';

export let pool: Pool;

export const init = () => {
  try {
    pool = new Pool();
  } catch(e) {
    log("Can't initialize database:");
    log(e);
  }
};

export const close = async () => {
  await pool.end();
};

export const getInt = (val: string, alias = val) => `${val}::text AS ${alias}`;

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
    // ({ rowCount: guilds } = await client.query(`DELETE FROM guilds
    // WHERE NOT EXISTS (
    //   SELECT FROM channels
    //   WHERE  channels."guildId" = guilds."guildId"
    // );`));
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