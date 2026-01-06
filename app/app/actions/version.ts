'use server';

import { readFile } from 'fs/promises';
import { join } from 'path';

export type ChangelogEntry = {
  version: string;
  date: string;
  type: 'production' | 'development' | 'service-worker' | 'service-worker-major';
  changes: string[];
};

export type DeploymentEntry = {
  version: string;
  date: string;
  environment: 'production' | 'staging' | 'development';
  status: 'success' | 'failed' | 'in-progress';
  commitHash?: string;
  deployedBy?: string;
};

export type VersionData = {
  version: string;
  serviceWorkerVersion: string;
  releaseDate: string;
  branch: string;
  changelog: ChangelogEntry[];
  deployments: DeploymentEntry[];
};

/**
 * Read version information from version.json
 * @returns Promise<VersionData>
 */
export async function getVersionData(): Promise<VersionData> {
  try {
    const versionFilePath = join(process.cwd(), 'version.json');
    const fileContent = await readFile(versionFilePath, 'utf-8');
    const data: VersionData = JSON.parse(fileContent);

    return data;
  } catch (error) {
    console.error('Failed to read version.json:', error);

    // Return fallback data if file doesn't exist
    return {
      version: '1.0.0',
      serviceWorkerVersion: '1.0.0',
      releaseDate: new Date().toISOString().split('T')[0],
      branch: 'main',
      changelog: [],
      deployments: [],
    };
  }
}

/**
 * Get current Git commit information (if available)
 * @returns Promise<{ hash: string; message: string; author: string; date: string } | null>
 */
export async function getGitCommitInfo(): Promise<{
  hash: string;
  message: string;
  author: string;
  date: string;
} | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Get latest commit info
    const { stdout: hash } = await execAsync('git rev-parse --short HEAD');
    const { stdout: message } = await execAsync('git log -1 --pretty=%B');
    const { stdout: author } = await execAsync('git log -1 --pretty=%an');
    const { stdout: date } = await execAsync('git log -1 --pretty=%ci');

    return {
      hash: hash.trim(),
      message: message.trim(),
      author: author.trim(),
      date: date.trim(),
    };
  } catch (_error) {
    // Git not available or not a git repo
    return null;
  }
}
