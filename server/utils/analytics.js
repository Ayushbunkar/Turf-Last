import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const LOG_DIR = path.resolve('./server/logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const ANALYTICS_LOG = path.join(LOG_DIR, 'analytics.log');

export const recordEvent = async (eventName, payload = {}) => {
  const entry = { ts: new Date().toISOString(), event: eventName, payload };
  try {
    fs.appendFileSync(ANALYTICS_LOG, JSON.stringify(entry) + '\n');
  } catch (e) {
    logger.warn('analytics.recordEvent failed', e?.message || e);
  }
};

export default { recordEvent };
