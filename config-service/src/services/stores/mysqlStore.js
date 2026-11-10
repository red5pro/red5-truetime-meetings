import mysql from 'mysql2/promise';

export const DEFAULT_DATABASE = 'truetime_meetings';
const TABLE = 'meetings_config';
// Interpolated into SQL (identifiers can't be bound), so only plain names are accepted
const IDENTIFIER = /^[A-Za-z0-9_]{1,64}$/;

/**
 * Database settings from the environment, or null when no database is configured (then the
 * service keeps its config in the JSON file). Host and user are required; the rest default.
 */
export function mysqlSettings(env = process.env) {
  const host = env.MEETINGS_DB_HOST?.trim();
  const user = env.MEETINGS_DB_USER?.trim();
  if (!host || !user) return null;
  const database = env.MEETINGS_DB_NAME?.trim() || DEFAULT_DATABASE;
  if (!IDENTIFIER.test(database)) {
    throw new Error(`MEETINGS_DB_NAME must be letters, digits and underscores: ${database}`);
  }
  const port = Number(env.MEETINGS_DB_PORT || 3306);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`MEETINGS_DB_PORT must be a port number: ${env.MEETINGS_DB_PORT}`);
  }
  return {
    host,
    port,
    user,
    password: env.MEETINGS_DB_PASSWORD ?? '',
    database,
    ssl: env.MEETINGS_DB_SSL === 'true' ? {} : undefined,
    connectRetries: Number(env.MEETINGS_DB_CONNECT_RETRIES || 10),
    connectRetryDelayMs: Number(env.MEETINGS_DB_CONNECT_RETRY_DELAY_MS || 3000),
  };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The config in MySQL, one row per key, in its own schema (`truetime_meetings` by default), so it
 * can share Studio's MySQL server without touching Studio's schema or its Flyway migrations.
 * Values are stored as JSON, so they come back with the types they were saved with.
 */
export function createMysqlStore(settings) {
  const { database, connectRetries, connectRetryDelayMs } = settings;
  const table = `\`${database}\`.\`${TABLE}\``;
  // No default database: the schema may not exist until init creates it
  const pool = mysql.createPool({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    ssl: settings.ssl,
    waitForConnections: true,
    connectionLimit: 5,
  });

  // The database may still be starting (e.g. both containers coming up together)
  async function connect() {
    for (let attempt = 1; ; attempt++) {
      try {
        await pool.query('SELECT 1');
        return;
      } catch (error) {
        if (attempt >= connectRetries) {
          throw new Error(
            `Can't connect to MySQL at ${settings.host}:${settings.port} as ${settings.user}: ${error.message}`,
            { cause: error },
          );
        }
        console.log(
          `Database not reachable yet (${error.code ?? error.message}), retry ${attempt}/${connectRetries - 1}...`,
        );
        await wait(connectRetryDelayMs);
      }
    }
  }

  async function createSchema() {
    try {
      await pool.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    } catch (error) {
      // A user limited to an existing schema may not create one; fine if it's already there
      const [rows] = await pool.query(
        'SELECT 1 FROM information_schema.schemata WHERE schema_name = ?',
        [database],
      );
      if (rows.length === 0) {
        throw new Error(
          `Schema ${database} doesn't exist and ${settings.user} can't create it (${error.message}). ` +
            `Create it, or GRANT ALL ON \`${database}\`.* TO '${settings.user}'.`,
          { cause: error },
        );
      }
    }
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ${table} (
        name VARCHAR(128) NOT NULL PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
    );
  }

  async function save(config) {
    const rows = Object.entries(config)
      // Like JSON.stringify for the file: undefined values aren't stored
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => [name, JSON.stringify(value)]);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // The whole config is replaced, as the file is: keys left out are removed
      await connection.query(`DELETE FROM ${table}`);
      if (rows.length > 0) {
        await connection.query(`INSERT INTO ${table} (name, value) VALUES ?`, [rows]);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  return {
    kind: 'mysql',
    describe: () => `MySQL ${settings.host}:${settings.port}, schema ${database}`,

    /** Connects, creates the schema and table if needed, and stores `seed()` when it's empty. */
    async init(seed) {
      await connect();
      await createSchema();
      const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
      if (Number(count) > 0) {
        console.log(`Config found in ${database}`);
        return;
      }
      await save(await seed());
      console.log(`Initial config stored in ${database}`);
    },

    async load() {
      const [rows] = await pool.query(`SELECT name, value FROM ${table}`);
      return Object.fromEntries(rows.map(({ name, value }) => [name, JSON.parse(value)]));
    },

    save,

    async close() {
      await pool.end();
    },
  };
}
