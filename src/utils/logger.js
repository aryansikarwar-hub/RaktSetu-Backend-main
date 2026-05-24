/* Minimal leveled logger — swap for pino/winston in production if desired. */
const ts = () => new Date().toISOString();
const colors = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };

export const logger = {
  info: (msg) => console.log(`${colors.info}[INFO]${colors.reset} ${ts()} — ${msg}`),
  warn: (msg) => console.warn(`${colors.warn}[WARN]${colors.reset} ${ts()} — ${msg}`),
  error: (msg) => console.error(`${colors.error}[ERROR]${colors.reset} ${ts()} — ${msg}`),
};
