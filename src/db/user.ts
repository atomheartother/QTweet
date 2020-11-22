import { getInt, pool, sanityCheck } from '.'

export const getUserIds = async () => {
    const { rows } = await pool.query(`SELECT ${getInt('"twitterId"')} FROM twitterUsers`);
    return rows;
  };

export const getUsersForSanityCheck = async (limit: number, cursor: number) => {
  const { rows } = await pool.query(`SELECT ${getInt('"twitterId"')} FROM twitterUsers LIMIT $1 OFFSET $2`, [limit, cursor * limit]);
  return rows;
};

export const bulkDeleteUsers = async (userIds) => {
  // Delete these users
  const { rowCount } = await pool.query(`DELETE FROM twitterUsers WHERE "twitterId" IN (${userIds.join(',')})`);
  return rowCount;
};

export const getUserInfo = async (twitterId: string) => {
  const { rows: [info] } = await pool.query('SELECT "name" FROM twitterUsers WHERE "twitterId" = $1', [twitterId]);
  return info;
};

export const updateUser = async (user: any) => {
  const usrInfo = await getUserInfo(user.id_str);
  if (!usrInfo || usrInfo.name !== user.screen_name) {
    return addUser(user.id_str, user.screen_name);
  }
  return 0;
};

export const addUser = async (twitterId: string, name: string) => {
  const { rowCount } = await pool.query('INSERT INTO twitterUsers("twitterId", "name") VALUES($1, $2) ON CONFLICT DO NOTHING', [twitterId, name]);
  return rowCount;
};

export const getUserFromScreenName = async (name: string) => {
  const { rows: [user] } = await pool.query(`SELECT ${getInt('"twitterId"')} FROM twitterUsers WHERE "name" = $1`, [name]);
  return user;
};

const rmUserSQL = async (twitterId: string) => {
  const { rowCount } = await pool.query('DELETE FROM twitterUsers WHERE "twitterId" = $1', [twitterId]);
  return rowCount;
};

export const rmUser = async (twitterId: string) => {
  const users = await rmUserSQL(twitterId);
  const { channels } = await sanityCheck();
  return { users, channels };
};
