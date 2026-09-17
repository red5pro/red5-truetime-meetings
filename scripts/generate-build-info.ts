import fs from 'fs';
import { execSync } from 'child_process';

const PRODUCT_PREFIX = 'TTM';
const TAG_GLOB = `${PRODUCT_PREFIX}-*-release`;
const TAG_REGEX = new RegExp(`^${PRODUCT_PREFIX}-(\\d+\\.\\d+\\.\\d+)\\.(\\d+)-release$`);

interface ReleaseInfo {
  base: string;
  buildNumber: number;
  status: 'release' | 'beta';
  latestTag: string | null;
}

function getReleaseInfo(): ReleaseInfo {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });

    const latestTag = execSync(`git tag --sort=-v:refname -l "${TAG_GLOB}"`, { encoding: 'utf8' })
      .trim()
      .split('\n')[0];

    if (!latestTag) {
      throw new Error(`No tags matching "${TAG_GLOB}" found`);
    }

    const match = latestTag.match(TAG_REGEX);
    if (!match) {
      throw new Error(`Latest tag "${latestTag}" does not match expected pattern`);
    }

    const [, base, numberStr] = match;
    const tagNumber = parseInt(numberStr, 10);

    const taggedCommit = execSync(`git rev-list -n 1 ${latestTag}`, { encoding: 'utf8' }).trim();
    const headCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

    if (taggedCommit === headCommit) {
      return { base, buildNumber: tagNumber, status: 'release', latestTag };
    }

    return { base, buildNumber: tagNumber + 1, status: 'beta', latestTag };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Release tag lookup failed:', errorMessage);
    return { base: '0.0.0', buildNumber: 0, status: 'beta', latestTag: null };
  }
}

const { base, buildNumber, status, latestTag }: ReleaseInfo = getReleaseInfo();

const date = new Date();
const day: string = date.getDate().toString().padStart(2, '0');
const monthNum: string = (date.getMonth() + 1).toString().padStart(2, '0');
const buildDate: string = `${day}.${monthNum}.${date.getFullYear()}`;
const buildTimestamp: string = Math.floor(date.getTime() / 1000).toString();

const version = `${PRODUCT_PREFIX}-${base}.${buildNumber}-${status}`;
const buildTime = `${buildDate}-${buildTimestamp}`;

const buildInfo = {
  version,
  base,
  buildNumber,
  status,
  latestTag,
  buildDate,
  buildTimestamp,
  buildTime,
};

// Write to public folder
fs.writeFileSync('public/build-info.json', JSON.stringify(buildInfo, null, 2));

// Write to env file
const envContent: string = `VITE_VERSION=${version}\nVITE_BUILD_TIME=${buildTime}\n`;

fs.writeFileSync('.env.local', envContent);
console.log('Build info generated:', buildInfo);
