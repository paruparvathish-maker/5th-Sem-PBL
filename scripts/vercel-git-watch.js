#!/usr/bin/env node
/**
 * Watches the Vercel project until its Git repository is linked to GitHub.
 *
 * Writes WAITING lines and a single CONNECTED line to .vercel-git-watch.log.
 * Uses the token the Vercel CLI already stores on this machine; the token is
 * never printed, logged or written anywhere.
 *
 * Usage: node scripts/vercel-git-watch.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const TEAM_ID = 'team_XN2Vo9IC3WFBlCXVBIZVWacR';
const PROJECT = '5th-sem-pbl-muns';
const REPO = '5th-Sem-PBL';
const LOG = path.join(__dirname, '..', '.vercel-git-watch.log');
const INTERVAL_MS = 30 * 1000;
const MAX_ATTEMPTS = 120; // 60 minutes

function findToken() {
  const candidates = [
    process.env.APPDATA && path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json'),
    process.env.APPDATA && path.join(process.env.APPDATA, 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), 'Library', 'Application Support', 'com.vercel.cli', 'auth.json'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const raw = fs.readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === 'string' && parsed.token.length > 10) {
        return parsed.token;
      }
    } catch (_) {
      /* try the next location */
    }
  }
  return null;
}

function log(line) {
  fs.appendFileSync(LOG, `${line}\n`, 'utf8');
}

function stamp() {
  return new Date().toISOString();
}

async function check(token) {
  const url = `https://api.vercel.com/v9/projects/${PROJECT}?teamId=${TEAM_ID}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const bodyText = await res.text();
  if (!res.ok) {
    // Body may echo request context; keep it to a status code only.
    throw new Error(`HTTP ${res.status}`);
  }
  const project = JSON.parse(bodyText);
  const link = project.link || {};
  return {
    type: link.type || 'none',
    repo: link.repo || 'none',
    branch: link.productionBranch || link.branch || 'none',
  };
}

async function main() {
  const token = findToken();
  if (!token) {
    log(`${stamp()} ERROR could not locate the Vercel CLI auth token on this machine`);
    process.exit(1);
  }

  log(`${stamp()} WATCHER started project=${PROJECT} teamId=${TEAM_ID}`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const state = await check(token);
      if (state.type === 'github' && state.repo === REPO) {
        log(`${stamp()} CONNECTED ${state.type}/${state.repo} productionBranch=${state.branch}`);
        return;
      }
      log(`${stamp()} WAITING attempt=${attempt} link.type=${state.type} link.repo=${state.repo}`);
    } catch (err) {
      log(`${stamp()} WAITING attempt=${attempt} error=${err.message}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
  }

  log(`${stamp()} TIMEOUT after ${MAX_ATTEMPTS} attempts; GitHub was never connected`);
  process.exit(2);
}

main().catch((err) => {
  log(`${stamp()} ERROR ${err.message}`);
  process.exit(1);
});
