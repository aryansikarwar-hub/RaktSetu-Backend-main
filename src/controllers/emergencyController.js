import { validationResult } from 'express-validator';
import { repo } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';
import { ai } from '../services/ai/index.js';
import { cityCoords } from '../utils/geo.js';
import { sendNotificationToUser } from '../services/realtime.js';
import { sendTemplatedSms, sendTemplatedEmail, sendTemplatedWhatsApp } from '../services/comm.js';

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
  // After saving, perform a quick match and notify top nearby compatible donors (in-app)
  try {
    const donors = await repo.listDonors({ bloodType: data.bloodType, city: data.city, available: true });
    const request = {
      bloodType: data.bloodType,
      city: data.city,
      urgency: data.urgency,
      coordinates: cityCoords(data.city),
    };
    const matches = await ai.matchDonors(request, donors);
    const top = (matches && matches.matches) ? matches.matches.slice(0, 10) : [];

    // map donors for lookup
    const donorsById = new Map();
    donors.forEach((d) => donorsById.set(String(d._id || d.id), d));

    for (const m of top) {
      const donorId = m.donorId || m.donor || m.id;
      const donor = donorsById.get(String(donorId));
      const outreach = await ai.writeOutreachMessage(donor || { name: m.name }, emergency);
      const note = await repo.createNotification(donorId, {
        type: 'emergency',
        title: `Urgent: ${data.units} unit(s) ${data.bloodType} needed`,
        body: outreach && outreach.message ? outreach.message : `A nearby hospital needs ${data.bloodType} blood. Please respond if available.`,
        urgent: data.urgency === 'critical',
        link: `/emergencies/${emergency._id}`,
      });

      // attempt realtime push; ignore failures (still persisted)
      sendNotificationToUser(donorId, note).catch(() => {});

      // send SMS / WhatsApp / email using admin templates where available — best-effort only
      try {
        const vars = { name: donor?.name || m.name || '', units: data.units || '', bloodType: data.bloodType || '', hospital: data.hospital || '', city: data.city || '', urgency: data.urgency || '' };
        if (donor && donor.phone && donor.phone.length > 6) {
          sendTemplatedSms(donor.phone, vars, outreach && outreach.message ? outreach.message : `${data.units} unit(s) ${data.bloodType} needed at ${data.hospital || data.city}`).catch(() => {});
          try {
            const waNumber = donor.phone.startsWith('+') ? `whatsapp:${donor.phone}` : `whatsapp:+${donor.phone}`;
            sendTemplatedWhatsApp(waNumber, vars, outreach && outreach.message ? outreach.message : `${data.units} unit(s) ${data.bloodType} needed at ${data.hospital || data.city}`).catch(() => {});
          } catch (e) {
            // ignore
          }
        }
        if (donor && donor.email && donor.email.includes('@')) {
          sendTemplatedEmail(donor.email, vars, `Urgent: ${data.units} unit(s) ${data.bloodType} needed`, outreach && outreach.message ? outreach.message : `A nearby hospital needs ${data.bloodType} blood. Please respond if available.`).catch(() => {});
        }
      } catch (err) {
        // ignore
      }
    }
  } catch (err) {
    // non-fatal — log and continue
    // eslint-disable-next-line no-console
    console.warn('Matching/notify failed', err.message);
  }

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
