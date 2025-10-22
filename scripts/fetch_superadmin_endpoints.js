/*
 Node script to fetch all superadmin GET endpoints and save responses to files.
 Usage:
   SUPERADMIN_TOKEN=<jwt> node scripts/fetch_superadmin_endpoints.js
*/

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:4500/superadmin';
const OUT_DIR = path.resolve('./scripts/superadmin-responses');
const token = process.env.SUPERADMIN_TOKEN || '';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const endpoints = [
  'emails/campaigns',
  'emails/templates',
  'emails/analytics',
  'emails/stats',
  'database/stats',
  'database/backups',
  'database/queries',
  'database/performance',
  'revenue/statistics',
  'revenue/chart',
  'revenue/top-turfs',
  'revenue/recent-transactions?limit=100',
  'turfs',
  'turfs/statistics',
  'turfs/statistics/public',
  'bookings',
  'bookings/statistics',
  'turfadmins',
  'turfadmins/statistics',
  'users',
  'users/statistics',
  'users/recent',
  'analytics',
  'dashboard-stats',
  'recent-activities',
  'support/tickets',
  'support/analytics',
  'notifications',
  'profile',
  'settings/system',
  'settings/notifications',
  'settings/security',
  'system/metrics',
  'system/services',
  'system/performance'
];

async function fetchAll() {
  for (const ep of endpoints) {
    try {
      const url = `${API_BASE}/${ep}`;
      console.log('Fetching', url);
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const text = await res.text();
      const safeName = ep.replace(/[\\/:?&=]/g, '_');
      const out = path.join(OUT_DIR, `${safeName}.json`);
      fs.writeFileSync(out, text, 'utf8');
      console.log('Saved', out);
    } catch (err) {
      console.error('Failed', ep, err.message || err);
      const errOut = path.join(OUT_DIR, `${ep.replace(/[\\/:?&=]/g, '_')}_error.txt`);
      fs.writeFileSync(errOut, String(err), 'utf8');
    }
  }
  console.log('Done. Files in', OUT_DIR);
}

fetchAll();
