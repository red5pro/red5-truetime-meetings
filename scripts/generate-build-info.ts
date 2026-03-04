import fs from 'fs';
import { execSync } from 'child_process';

interface GitInfo {
  gitHash: string;
  gitCount: string;
}

interface BuildInfo {
  hash: string;
  number: string;
  timestamp: string;
}

function getGitInfo(): GitInfo {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });

    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const gitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();

    console.log(`Git hash: ${gitHash}`);
    console.log(`Git count: ${gitCount}`);

    return { gitHash, gitCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Git command failed:', errorMessage);
    return { gitHash: 'no-git', gitCount: Date.now().toString() };
  }
}

const { gitHash, gitCount }: GitInfo = getGitInfo();

const date = new Date();
const month: string = date.toLocaleString('default', { month: 'long' }); // e.g. "July"
const buildTime: string = `${date.getDate()}-${month}-${date.getFullYear()}`;

const buildInfo: BuildInfo = {
  hash: gitHash,
  number: gitCount,
  timestamp: buildTime,
};

// Write to public folder
fs.writeFileSync('public/build-info.json', JSON.stringify(buildInfo, null, 2));

// Write to env file
const envContent: string = `VITE_BUILD_NUMBER=${gitCount}
VITE_BUILD_HASH=${gitHash}
VITE_BUILD_TIME=${buildTime}
`;

fs.writeFileSync('.env.local', envContent);
console.log('Build info generated:', buildInfo);
