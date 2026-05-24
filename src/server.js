import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initMockStore } from './services/mockStore.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB();
  if (env.USE_MOCK) initMockStore();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`RaktSetu API running on http://localhost:${env.PORT}`);
    logger.info(`Mode: ${env.USE_MOCK ? 'MOCK (in-memory)' : 'MongoDB'} | AI: ${env.AI_MODE}`);
  });
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
