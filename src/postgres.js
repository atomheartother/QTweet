import { Pool } from 'pg';

const pool = new Pool()

// pool.query('SELECT NOW()', (err, res) => {
//     console.log(err, res)
//     pool.end()
// });

export const init = async () => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query(`CREATE TABLE IF NOT EXISTS twitterUsers (
            twitterId   integer PRIMARY KEY,
            name        text
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS subs (
          twitterId     integer,
          channelId     integer,
          isDM          integer NOT NULL,
          flags         INTEGER NOT NULL,
          CONSTRAINT    sub_key PRIMARY KEY(twitterId, channelId)
        )`);
    
        await client.query(`CREATE TABLE IF NOT EXISTS guilds (
            guildId     integer PRIMARY KEY,
            lang TEXT NOT NULL DEFAULT '${
                config.defaultLang
            }'
        )`)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
}
