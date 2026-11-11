import fs from 'fs/promises';
import path from 'path';

/** The config as a JSON file (the default when no database is configured). */
export function createFileStore(file) {
  return {
    kind: 'file',
    describe: () => `file ${file}`,

    /** Writes `seed()` when the file doesn't exist yet. */
    async init(seed) {
      try {
        await fs.access(file);
        console.log('Config file already exists');
      } catch {
        console.log('Creating initial config file from environment variables...');
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(await seed(), null, 2));
        console.log('Config file created successfully');
      }
    },

    async load() {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    },

    async save(config) {
      await fs.writeFile(file, JSON.stringify(config, null, 2));
    },

    async close() {},
  };
}

/** The config file's contents, or null when there is none (or it can't be read). */
export async function readConfigFile(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}
