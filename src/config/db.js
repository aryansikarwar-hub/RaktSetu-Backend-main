import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB.
 * When USE_MOCK=true we skip the real connection entirely and the app
 * runs against the in-memory mock store (see src/services/mockStore.js).
 * This lets the project boot & deploy a live preview before a DB exists.
 */
export async function connectDB() {
  if (env.USE_MOCK) {
    logger.warn('USE_MOCK=true — running with in-memory mock store (no MongoDB).');
    return null;
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));

    return conn;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    logger.error('Tip: set USE_MOCK=true in .env to run without a database.');
    process.exit(1);
  }
}

export { mongoose };
