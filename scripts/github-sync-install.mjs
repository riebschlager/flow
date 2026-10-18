#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { chmodSync, readFileSync } from 'node:fs';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (JSON.parse(readFileSync('.openai/hosting.json', 'utf8')).project_id !== 'appgprj_6ad2bd4c8af0819199f8a75edc190fd6') throw new Error('Run from the Flow checkout.');
let existing = '';
try { existing = git('config', '--get', 'core.hooksPath'); } catch {}
if (existing && existing !== '.githooks') throw new Error(`Existing hooks path ${existing}; integrate Flow sync without replacing existing hooks.`);
chmodSync('.githooks/post-commit', 0o755);
git('config', '--local', 'core.hooksPath', '.githooks');
git('config', '--local', 'remote.github.url', 'https://github.com/riebschlager/flow.git');
git('config', '--local', 'remote.github.fetch', '+refs/heads/*:refs/remotes/github/*');
console.log('Flow automatic GitHub sync enabled after each commit in this checkout.');
