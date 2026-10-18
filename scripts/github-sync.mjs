#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const repository = 'https://github.com/riebschlager/flow.git';
const projectId = 'appgprj_6ad2bd4c8af0819199f8a75edc190fd6';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
if (JSON.parse(readFileSync('.openai/hosting.json', 'utf8')).project_id !== projectId) {
  throw new Error('Run this command from the Flow source checkout.');
}
if (git('status', '--porcelain')) throw new Error('Commit the completed update before syncing to GitHub.');
const head = git('rev-parse', 'HEAD');
git('push', repository, `${head}:refs/heads/main`);
const remoteHead = git('ls-remote', repository, 'refs/heads/main').split(/\s+/)[0];
if (remoteHead !== head) throw new Error('GitHub verification failed; inspect the remote before retrying.');
console.log(`Flow synced to GitHub: ${head}`);
