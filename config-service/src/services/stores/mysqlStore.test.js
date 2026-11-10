import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// An in-memory stand-in for the MySQL server, understanding the statements the store sends
const db = vi.hoisted(() => ({
  reset() {
    this.schemas = new Set();
    this.tables = new Map();
    this.unreachable = 0;
    this.canCreateSchema = true;
    this.failInsert = false;
    this.poolOptions = null;
    this.ended = false;
  },
}));

vi.mock('mysql2/promise', () => {
  const run = async (sql, params) => {
    const text = sql.replace(/\s+/g, ' ').trim();
    let m;
    if (text === 'SELECT 1') {
      if (db.unreachable > 0) {
        db.unreachable--;
        throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
      }
      return [[{ 1: 1 }]];
    }
    if ((m = text.match(/^CREATE DATABASE IF NOT EXISTS `(\w+)`$/))) {
      if (!db.canCreateSchema) throw new Error('Access denied to database');
      db.schemas.add(m[1]);
      return [{}];
    }
    if (text.includes('information_schema.schemata')) {
      return [db.schemas.has(params[0]) ? [{ 1: 1 }] : []];
    }
    if ((m = text.match(/^CREATE TABLE IF NOT EXISTS `(\w+)`\.`(\w+)`/))) {
      if (!db.schemas.has(m[1])) throw new Error(`Unknown database '${m[1]}'`);
      const key = `${m[1]}.${m[2]}`;
      if (!db.tables.has(key)) db.tables.set(key, new Map());
      return [{}];
    }
    const table = (t) => {
      const [, schema, name] = t.match(/`(\w+)`\.`(\w+)`/);
      return db.tables.get(`${schema}.${name}`);
    };
    if (text.startsWith('SELECT COUNT(*)')) return [[{ count: table(text).size }]];
    if (text.startsWith('SELECT name, value')) {
      return [[...table(text)].map(([name, value]) => ({ name, value }))];
    }
    if (text.startsWith('DELETE FROM')) {
      table(text).clear();
      return [{}];
    }
    if (text.startsWith('INSERT INTO')) {
      if (db.failInsert) throw new Error('Disk full');
      params[0].forEach(([name, value]) => table(text).set(name, value));
      return [{}];
    }
    throw new Error(`Unexpected SQL: ${text}`);
  };
  return {
    default: {
      createPool: (options) => {
        db.poolOptions = options;
        return {
          query: run,
          end: async () => {
            db.ended = true;
          },
          getConnection: async () => {
            let snapshot = null;
            return {
              query: run,
              beginTransaction: async () => {
                snapshot = new Map([...db.tables].map(([k, v]) => [k, new Map(v)]));
              },
              commit: async () => {
                snapshot = null;
              },
              rollback: async () => {
                db.tables = snapshot;
              },
              release: () => {},
            };
          },
        };
      },
    },
  };
});

const { createMysqlStore, mysqlSettings, DEFAULT_DATABASE } = await import('./mysqlStore.js');

const settings = (overrides = {}) => ({
  ...mysqlSettings({
    MEETINGS_DB_HOST: 'mysql.internal',
    MEETINGS_DB_USER: 'meetings',
    MEETINGS_DB_PASSWORD: 'secret',
  }),
  connectRetryDelayMs: 0,
  ...overrides,
});

beforeEach(() => db.reset());

describe('mysqlSettings', () => {
  it('is off unless both host and user are set', () => {
    expect(mysqlSettings({})).toBeNull();
    expect(mysqlSettings({ MEETINGS_DB_HOST: 'db' })).toBeNull();
    expect(mysqlSettings({ MEETINGS_DB_USER: 'u' })).toBeNull();
    expect(mysqlSettings({ MEETINGS_DB_HOST: ' ', MEETINGS_DB_USER: 'u' })).toBeNull();
  });

  it('defaults the port and its own schema, next to Studio’s', () => {
    expect(mysqlSettings({ MEETINGS_DB_HOST: 'db', MEETINGS_DB_USER: 'u' })).toMatchObject({
      host: 'db',
      port: 3306,
      user: 'u',
      password: '',
      database: DEFAULT_DATABASE,
    });
    expect(DEFAULT_DATABASE).toBe('truetime_meetings');
  });

  it('refuses a schema name or port it can’t use safely', () => {
    const base = { MEETINGS_DB_HOST: 'db', MEETINGS_DB_USER: 'u' };
    expect(() => mysqlSettings({ ...base, MEETINGS_DB_NAME: 'x`; DROP TABLE y' })).toThrow(
      /MEETINGS_DB_NAME/,
    );
    expect(() => mysqlSettings({ ...base, MEETINGS_DB_PORT: 'abc' })).toThrow(/MEETINGS_DB_PORT/);
  });
});

describe('createMysqlStore', () => {
  it('creates its schema and table, seeds an empty table once, and reads it back', async () => {
    const store = createMysqlStore(settings());
    const seed = vi.fn(async () => ({ VITE_HOST: 'a.example', VITE_FLAG: true, gone: undefined }));
    await store.init(seed);
    expect(db.schemas.has('truetime_meetings')).toBe(true);
    // Connected without a default schema (it may not exist yet)
    expect(db.poolOptions).toMatchObject({ host: 'mysql.internal', user: 'meetings' });
    expect(db.poolOptions.database).toBeUndefined();
    // Types survive; undefined isn't stored, as in the JSON file
    expect(await store.load()).toEqual({ VITE_HOST: 'a.example', VITE_FLAG: true });

    await createMysqlStore(settings()).init(seed);
    expect(seed).toHaveBeenCalledTimes(1);
  });

  it('replaces the whole config on save, and keeps the old one if saving fails', async () => {
    const store = createMysqlStore(settings());
    await store.init(async () => ({ A: '1', B: '2' }));
    await store.save({ A: '3', C: '4' });
    expect(await store.load()).toEqual({ A: '3', C: '4' });

    db.failInsert = true;
    await expect(store.save({ A: 'lost' })).rejects.toThrow('Disk full');
    expect(await store.load()).toEqual({ A: '3', C: '4' });
  });

  it('waits for a database that is still starting', async () => {
    db.unreachable = 2;
    const store = createMysqlStore(settings({ connectRetries: 3 }));
    await store.init(async () => ({}));
    expect(db.unreachable).toBe(0);
  });

  it('fails startup when the database stays unreachable', async () => {
    db.unreachable = 5;
    const store = createMysqlStore(settings({ connectRetries: 2 }));
    await expect(store.init(async () => ({}))).rejects.toThrow(
      /Can't connect to MySQL at mysql.internal:3306 as meetings/,
    );
  });

  it('uses a schema an admin created when the user can’t create one', async () => {
    db.canCreateSchema = false;
    db.schemas.add('truetime_meetings');
    const store = createMysqlStore(settings());
    await store.init(async () => ({ A: '1' }));
    expect(await store.load()).toEqual({ A: '1' });
  });

  it('says what to grant when the schema is missing and can’t be created', async () => {
    db.canCreateSchema = false;
    const store = createMysqlStore(settings());
    await expect(store.init(async () => ({}))).rejects.toThrow(
      /GRANT ALL ON `truetime_meetings`\.\* TO 'meetings'/,
    );
  });
});

describe('configService storage', () => {
  let dir;
  let file;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-service-db-'));
    file = path.join(dir, 'config.json');
    vi.stubEnv('CONFIG_FILE', file);
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  const load = async () => (await import('../configService.js')).default;

  it('keeps using the JSON file when no database is configured', async () => {
    vi.stubEnv('MEETINGS_DB_HOST', '');
    const service = await load();
    await service.initialize();
    expect(service.describeStorage()).toBe(`file ${file}`);
    await service.update({ VITE_HOST: 'file.example' });
    expect(JSON.parse(await fs.readFile(file, 'utf8')).VITE_HOST).toBe('file.example');
    expect(db.tables.size).toBe(0);
  });

  it('moves to the database, carrying over the existing config file', async () => {
    await fs.writeFile(
      file,
      JSON.stringify({ VITE_HOST: 'old.example', VITE_DEFAULT_THEME: 'blue' }),
    );
    vi.stubEnv('MEETINGS_DB_HOST', 'mysql.internal');
    vi.stubEnv('MEETINGS_DB_USER', 'meetings');
    vi.stubEnv('MEETINGS_DB_CONNECT_RETRY_DELAY_MS', '0');
    const service = await load();
    await service.initialize();
    expect(service.describeStorage()).toBe('MySQL mysql.internal:3306, schema truetime_meetings');
    expect(await service.read()).toMatchObject({
      VITE_HOST: 'old.example',
      VITE_DEFAULT_THEME: 'blue',
    });

    // Saves go to the database; the file is left as it was
    await service.update({ VITE_HOST: 'db.example', VITE_AWS_SECRET_ACCESS_KEY: 's3cret' });
    expect((await service.read()).VITE_HOST).toBe('db.example');
    expect(JSON.parse(await fs.readFile(file, 'utf8')).VITE_HOST).toBe('old.example');
    // The mask keeps the stored secret, as with the file
    await service.update({ VITE_AWS_SECRET_ACCESS_KEY: '***' });
    expect((await service.read()).VITE_AWS_SECRET_ACCESS_KEY).toBe('s3cret');

    await service.close();
    expect(db.ended).toBe(true);
  });

  it('starts a new database from the environment when there is no config file', async () => {
    vi.stubEnv('MEETINGS_DB_HOST', 'mysql.internal');
    vi.stubEnv('MEETINGS_DB_USER', 'meetings');
    vi.stubEnv('VITE_HOST', 'env.example');
    const service = await load();
    await service.initialize();
    expect(await service.read()).toMatchObject({
      VITE_HOST: 'env.example',
      VITE_DEFAULT_THEME: 'black',
    });
  });
});
