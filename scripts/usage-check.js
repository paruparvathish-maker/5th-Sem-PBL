#!/usr/bin/env node
/**
 * Prints this billing period's Vercel usage against the Hobby plan limits.
 *
 *   node scripts/usage-check.js
 *
 * Reads the token the Vercel CLI already stored on this machine; the token is
 * never printed. No values are written anywhere.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const TEAM = process.env.VERCEL_TEAM_ID || 'team_XN2Vo9IC3WFBlCXVBIZVWacR';

// Hobby plan allowances (per month).
const LIMITS = {
  fastDataTransferBytes: 100 * 1024 ** 3, // Fast Data Transfer: 100 GB
  fastOriginTransferBytes: 10 * 1024 ** 3, // Fast Origin Transfer: 10 GB
  edgeRequests: 1_000_000,
  functionInvocations: 1_000_000,
  fluidActiveCpuHours: 4,
  provisionedMemoryGbHours: 360,
};

function authToken() {
  const fromEnv = process.env.VERCEL_TOKEN;
  if (fromEnv) return fromEnv;
  const authPath = path.join(os.homedir(), '.vercel', 'auth.json');
  const winAuthPath = path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json');
  for (const candidate of [authPath, winAuthPath]) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (parsed.token) return parsed.token;
    } catch {}
  }
  return null;
}

function gb(bytes) {
  return (bytes / 1024 ** 3).toFixed(2);
}

function bar(used, limit) {
  const ratio = limit > 0 ? used / limit : 0;
  const filled = Math.min(20, Math.round(ratio * 20));
  return `[${'#'.repeat(filled)}${'.'.repeat(20 - filled)}] ${(ratio * 100).toFixed(1)}%`;
}

(async () => {
  const token = authToken();
  if (!token) {
    console.error('No Vercel token found. Run `npx vercel login` first.');
    process.exit(1);
  }

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const daysLeft = Math.max(0, Math.ceil((periodEnd - now) / 86400000));

  const url =
    `https://api.vercel.com/v2/usage?teamId=${TEAM}` +
    `&from=${periodStart.toISOString()}&to=${now.toISOString()}&type=requests`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(
      `The usage API answered ${res.status}. On the Hobby plan this endpoint is limited; ` +
        'read the Usage page in the Vercel dashboard instead.'
    );
    process.exit(2);
  }

  const json = await res.json();
  const totals = {};
  for (const day of json.data || []) {
    for (const [key, value] of Object.entries(day)) {
      if (typeof value === 'number') totals[key] = (totals[key] || 0) + value;
    }
  }

  const outgoing = totals.bandwidth_outgoing_bytes || 0;
  const incoming = totals.bandwidth_incoming_bytes || 0;
  const requests = (totals.request_hit_count || 0) + (totals.request_miss_count || 0);
  const invocations =
    (totals.function_invocation_successful_count || 0) + (totals.function_invocation_error_count || 0);

  console.log(`Vercel usage for ${TEAM}`);
  console.log(`Period ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)} — ${daysLeft} day(s) left\n`);

  console.log(`Outgoing bandwidth   ${gb(outgoing)} GB   (limit 100 GB Fast Data Transfer)`);
  console.log(`  ${bar(outgoing, LIMITS.fastDataTransferBytes)}`);
  console.log(`Incoming bandwidth   ${gb(incoming)} GB`);
  console.log(`Requests             ${requests.toLocaleString()}   (limit ${LIMITS.edgeRequests.toLocaleString()})`);
  console.log(`  ${bar(requests, LIMITS.edgeRequests)}`);
  console.log(`Function calls       ${invocations.toLocaleString()}   (limit ${LIMITS.functionInvocations.toLocaleString()})`);
  console.log(`  ${bar(invocations, LIMITS.functionInvocations)}`);
  console.log(
    `Function GB-hours    ${(totals.function_execution_successful_gb_hours || 0).toFixed(2)}   (limit ${LIMITS.provisionedMemoryGbHours} GB-hr provisioned memory)`
  );

  const daysElapsed = Math.max(1, now.getUTCDate());
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  console.log(
    `\nAt the current rate (${gb(outgoing / daysElapsed)} GB/day): ` +
      `${gb((outgoing / daysElapsed) * daysInMonth)} GB outgoing this month.`
  );
  console.log(
    '\nFast Origin Transfer is reported separately in the dashboard (Usage -> Fast Origin Transfer); ' +
      'the API above counts all outgoing bandwidth together.'
  );
})();
