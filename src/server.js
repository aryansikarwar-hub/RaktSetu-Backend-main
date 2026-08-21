import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initMockStore } from './services/mockStore.js';
import { logger } from './utils/logger.js';
import http from 'http';
import { initRealtime } from './services/realtime.js';
import { startWorker as startCommQueue } from './services/commQueue.js';

async function start() {
  await connectDB();
  if (env.USE_MOCK) initMockStore();

  const app = createApp();
  const server = http.createServer(app);
  // initialize realtime WS server
  initRealtime(server);
  // start comm queue worker if enabled
  startCommQueue();

  server.listen(env.PORT, () => {
    logger.info(`RaktSetu API running on http://localhost:${env.PORT}`);
    logger.info(`Mode: ${env.USE_MOCK ? 'MOCK (in-memory)' : 'MongoDB'} | AI: ${env.AI_MODE}`);
  });
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
