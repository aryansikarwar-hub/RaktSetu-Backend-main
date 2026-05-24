import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS — allow the configured frontend origin(s)
  const origins = env.CLIENT_URL.split(',').map((o) => o.trim());
  app.use(cors({ origin: origins, credentials: true }));

  if (!isProd) app.use(morgan('dev'));

  // Basic rate limiting to protect the API
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', mock: env.USE_MOCK, ai: env.AI_MODE, time: new Date().toISOString() })
  );

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
