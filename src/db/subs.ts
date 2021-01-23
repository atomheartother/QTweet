import { QCSerialized } from "../shard/QChannel/type";
import { getInt, pool, sanityCheck } from ".";
import { addChannel } from "./channels";
import { addUser } from "./user";

type DbSubscription = {
  twitterId: string
  channelId: string
  isDM: string
  flags: string
  msg: string
}

export const getAllSubs = async () => {
  const { rows } = await pool.query<DbSubscription>(`SELECT ${getInt('subs."channelId"', '"channelId"')}, ${getInt(
    '"twitterId"',
  )}, subs."isDM" AS "isDM", "flags" FROM subs`);
  return rows;
};

export const addSubscription = async (
  channelId: string,
  twitterId: string,
  flags: number,
  isDM: boolean,
  msg: string) => {
  const { rows: [{ case: inserted }] } = await pool.query<{case: number}>(`
  INSERT INTO 
    subs("channelId", "twitterId", "flags", "isDM", "msg")
  VALUES($1, $2, $3, $4, $5)
    ON CONFLICT ON CONSTRAINT sub_key
  DO UPDATE SET "flags"=$3, "msg"=$5
  RETURNING case when xmax::text::int > 0 then 0 else 1 end`,
  [channelId, twitterId, flags, isDM, msg || null]);
  return inserted;
};

export const removeSubscription = async (channelId: string, twitterId: string) => {
  const { rowCount } = await pool.query('DELETE FROM subs WHERE "channelId" = $1 AND "twitterId" = $2', [channelId, twitterId]);
  return rowCount;
};

export const getGuildSubs = async (guildId: string) => {
  const { rows } = await pool.query<DbSubscription>(`
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

export const getChannelSubs = async (channelId: string, withName = false) => {
  const { rows } = await pool.query<DbSubscription>(withName
    ? `SELECT ${getInt(
      'subs."twitterId"',
      '"twitterId"',
    )},
    "name",
    "flags",
    "msg" 
    FROM subs INNER JOIN twitterUsers ON subs."twitterId" = twitterUsers."twitterId"
    WHERE subs."channelId"=$1`
    : `SELECT ${getInt(
      '"twitterId"',
    )}, "flags" FROM subs WHERE subs."channelId"=$1`,
  [channelId]);
  return rows;
};

export const getUserSubs = async (twitterId: string, withInfo = false) => {
  const { rows } = await pool.query<DbSubscription>(
    withInfo
      ? `SELECT ${getInt('subs."channelId"', '"channelId"')}, "flags", ${getInt(
        '"guildId"',
      )}, ${getInt(
        '"ownerId"',
      )}, "subs."isDM"" AS "isDM" FROM subs INNER JOIN channels ON subs."channelId" = channels."channelId" WHERE subs."twitterId"=$1;`
      : `SELECT ${getInt(
        '"channelId"',
      )}, "flags", "isDM", "msg" FROM subs WHERE "twitterId"=$1`, [twitterId],
  );
  return rows;
};

// Add a subscription to this userId or update an existing one
export const add = async (
  {
    channelId, isDM, guildId, ownerId,
  }: QCSerialized & {guildId: string, ownerId: string},
  twitterId: string,
  name: string,
  flags: number,
  msg: string
) => {
  const users = await addUser(twitterId, name);
  const channels = await addChannel(channelId, guildId, ownerId, isDM);
  const subs = await addSubscription(channelId, twitterId, flags, isDM, msg);
  return { subs, users, channels };
};

// Remove a subscription
// If this user doesn't have any more subs, delete it as well
export const rm = async (channelId: string, twitterId: string) => {
  const subs = await removeSubscription(channelId, twitterId);
  const { channels, users } = await sanityCheck();
  return { subs, channels, users };
};
