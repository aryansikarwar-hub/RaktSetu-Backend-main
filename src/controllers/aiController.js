import { repo } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';
import { ai } from '../services/ai/index.js';
import { cityCoords } from '../utils/geo.js';
import { SUGGESTED_QUESTIONS } from '../services/ai/knowledgeBase.js';

/** POST /api/ai/eligibility — pre-screen a prospective donor from answers. */
export const screenEligibility = asyncHandler(async (req, res) => {
  const result = await ai.screenEligibility(req.body || {});
  res.json({ success: true, ...result });
});

/** GET /api/ai/forecast?city=Mumbai — blood demand forecast for a city. */
export const forecast = asyncHandler(async (req, res) => {
  const city = req.query.city || 'Mumbai';
  const hospitals = await repo.listHospitals(city);
  const history = [];
  hospitals.forEach((h) => (h.inventory || []).forEach((i) => history.push(i)));
  const result = await ai.forecastDemand(city, history);
  res.json({ success: true, ...result });
});

/** POST /api/ai/match — ad-hoc donor match for an arbitrary request body. */
export const matchAdhoc = asyncHandler(async (req, res) => {
  const { bloodType, city, urgency = 'urgent' } = req.body;
  if (!bloodType) return res.status(400).json({ success: false, message: 'bloodType is required' });
  const donors = await repo.listDonors({});
  const result = await ai.matchDonors(
    { bloodType, city, urgency, coordinates: cityCoords(city) },
    donors
  );
  res.json({ success: true, ...result });
});

/** GET /api/ai/status — report which AI engine is active. */
export const status = asyncHandler(async (_req, res) => {
  res.json({ success: true, mode: ai.mode, features: ['match', 'eligibility', 'forecast', 'triage', 'chat', 'describe-emergency', 'outreach'] });
});

/** GET /api/ai/chat/suggestions — starter questions for the chatbot. */
export const chatSuggestions = asyncHandler(async (_req, res) => {
  res.json({ success: true, suggestions: SUGGESTED_QUESTIONS });
});

/** POST /api/ai/chat — RAG chatbot grounded in FAQ + live data. */
export const chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  // Build live grounding context.
  const stats = await repo.stats();
  const emergencies = await repo.listEmergencies({ status: 'open' });
  const top = emergencies[0];
  const live = {
    donors: stats.donors,
    hospitals: stats.hospitals,
    totalUnits: stats.totalUnits,
    openEmergencies: stats.openEmergencies,
    topEmergency: top ? { bloodType: top.bloodType, units: top.units, hospital: top.hospital, city: top.city } : null,
  };

  const result = await ai.chat(String(message).slice(0, 500), { live, history: history || [] });
  res.json({ success: true, ...result });
});

/** POST /api/ai/describe-emergency — AI writes a professional description. */
export const describeEmergency = asyncHandler(async (req, res) => {
  const result = await ai.writeEmergencyDescription(req.body || {});
  res.json({ success: true, ...result });
});

/** POST /api/ai/outreach — AI writes a personalized donor outreach message. */
export const outreachMessage = asyncHandler(async (req, res) => {
  const { donor = {}, request = {} } = req.body || {};
  const result = await ai.writeOutreachMessage(donor, request);
  res.json({ success: true, ...result });
});

/** POST /api/ai/eligibility-chat — conversational eligibility assistant. */
export const eligibilityChat = asyncHandler(async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  const result = await ai.eligibilityChat(String(message).slice(0, 500), history || []);
  res.json({ success: true, ...result });
});