import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const ALERTS_PATH = path.resolve(process.cwd(), 'server', 'logs');
try { if (!fs.existsSync(ALERTS_PATH)) fs.mkdirSync(ALERTS_PATH, { recursive: true }); } catch(e) { /* ignore */ }
const ALERT_FILE = path.join(ALERTS_PATH, 'alerts.log');

export function alertSyntheticOrder(info = {}) {
  try {
    const entry = { time: new Date().toISOString(), type: 'synthetic_order_returned', info };
    fs.appendFileSync(ALERT_FILE, JSON.stringify(entry) + '\n');
    logger.warn('ALERT synthetic order returned', entry);
  } catch (e) {
    logger.error('Failed to write alert', e?.message || e);
  }
}

export default { alertSyntheticOrder };
