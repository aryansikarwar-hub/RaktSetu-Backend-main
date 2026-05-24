import { validationResult } from 'express-validator';
import { repo } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';
import { ai } from '../services/ai/index.js';
import { cityCoords } from '../utils/geo.js';

/** GET /api/emergencies — active feed, sorted by AI priority. */
export const listEmergencies = asyncHandler(async (req, res) => {
  const { status = 'open', city } = req.query;
  const emergencies = await repo.listEmergencies({ status, city });
  res.json({ success: true, count: emergencies.length, emergencies });
});

/** POST /api/emergencies — create a request; AI triage assigns priority. */
export const createEmergency = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const data = { ...req.body };
  if (req.user) data.createdBy = req.user._id || req.user.id;

  // AI triage — assigns priorityScore + label + reasons before saving.
  const triage = await ai.triageRequest(data);
  data.priorityScore = triage.priorityScore;
  data.triageLabel = triage.triageLabel;
  data.triageReasons = triage.triageReasons;

  const emergency = await repo.createEmergency(data);
  res.status(201).json({ success: true, emergency, triage });
});

/** GET /api/emergencies/:id/matches — AI-ranked donor matches for a request. */
export const matchDonors = asyncHandler(async (req, res) => {
  const emergency = await repo.findEmergencyById(req.params.id);
  if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

  const donors = await repo.listDonors({});
  const request = {
    bloodType: emergency.bloodType,
    city: emergency.city,
    urgency: emergency.urgency,
    coordinates: cityCoords(emergency.city),
  };
  const result = await ai.matchDonors(request, donors);
  res.json({ success: true, ...result });
});

/** POST /api/emergencies/:id/respond — a donor pledges to respond. */
export const respond = asyncHandler(async (req, res) => {
  const emergency = await repo.findEmergencyById(req.params.id);
  if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

  const matchedDonors = Array.from(new Set([...(emergency.matchedDonors || []), req.user._id || req.user.id]));
  const updated = await repo.updateEmergency(req.params.id, {
    respondersCount: (emergency.respondersCount || 0) + 1,
    matchedDonors,
    status: 'matched',
  });
  res.json({ success: true, emergency: updated });
});
