export function info(...args) {
  console.log(new Date().toISOString(), '[INFO]', ...args);
}

export function warn(...args) {
  console.warn(new Date().toISOString(), '[WARN]', ...args);
}

export function error(...args) {
  console.error(new Date().toISOString(), '[ERROR]', ...args);
}

export function debug(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(new Date().toISOString(), '[DEBUG]', ...args);
  }
}

export default { info, warn, error, debug };
