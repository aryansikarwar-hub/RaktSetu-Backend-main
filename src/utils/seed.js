/**
 * Seed script — populates MongoDB with realistic demo data.
 * Usage: npm run seed   (requires USE_MOCK=false and a valid MONGO_URI)
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import { seedUsers, seedHospitals, seedEmergencies } from '../data/seedData.js';
import { triageRequest } from '../services/ai/engines/rulesEngine.js';

async function seed() {
  if (env.USE_MOCK) {
    logger.warn('USE_MOCK=true — nothing to seed. Set USE_MOCK=false to seed MongoDB.');
    process.exit(0);
  }

  await mongoose.connect(env.MONGO_URI);
  logger.info('Connected. Clearing existing collections...');
  await Promise.all([User.deleteMany({}), Hospital.deleteMany({}), EmergencyRequest.deleteMany({})]);

  logger.info('Inserting users...');
  // create() triggers password hashing via the pre-save hook
  for (const u of seedUsers) {
    await User.create({ ...u, lastDonation: u.lastDonation ? new Date(u.lastDonation) : null });
  }

  logger.info('Inserting hospitals...');
  await Hospital.insertMany(seedHospitals);

  logger.info('Inserting emergencies (with AI triage)...');
  for (const e of seedEmergencies) {
    const t = triageRequest(e);
    await EmergencyRequest.create({
      ...e,
      priorityScore: t.priorityScore,
      triageLabel: t.triageLabel,
      triageReasons: t.triageReasons,
      expiresAt: new Date(Date.now() + 6 * 3600000),
    });
  }

  logger.info('Seed complete. Demo login: arjun@raktsetu.in / password123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
