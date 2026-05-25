/**
 * RULE-BASED AI ENGINE
 * Deterministic, explainable, offline implementations of the four AI features.
 * These define the canonical OUTPUT SHAPE that any LLM adapter must also return,
 * and they serve as the always-available fallback.
 */
import { isCompatible, donationEligibility, donorsForRecipient } from '../../../utils/bloodLogic.js';
import { haversineKm, cityCoords } from '../../../utils/geo.js';

/* ───────────────────────────── 1. DONOR MATCH ───────────────────────────── */
/**
 * Score each donor 0-100 for a given request. Higher = better match.
 * Factors: blood compatibility (gate), proximity, eligibility, reliability,
 * availability, and same-city bonus. Returns sorted, with human-readable
 * `reasons` so coordinators understand WHY a donor ranked high.
 */
export function matchDonors(request, donors = []) {
  const reqCoords = request.coordinates || cityCoords(request.city);

  const scored = donors
    .filter((d) => isCompatible(d.bloodType, request.bloodType))
    .map((d) => {
      const reasons = [];
      let score = 0;

      // Compatibility tier (exact type is ideal; universal still good)
      if (d.bloodType === request.bloodType) {
        score += 35;
        reasons.push('Exact blood-type match');
      } else {
        score += 22;
        reasons.push(`${d.bloodType} is compatible with ${request.bloodType}`);
      }

      // Eligibility (cooldown since last donation)
      const elig = donationEligibility(d.lastDonation);
      if (elig.eligible) {
        score += 25;
        reasons.push('Eligible to donate now');
      } else {
        score += Math.max(0, 12 - elig.daysRemaining / 10);
        reasons.push(`Eligible in ${elig.daysRemaining} days`);
      }

      // Proximity
      const dCoords = d.coordinates || (d.location && d.location.coordinates) || cityCoords(d.city);
      let distanceKm = null;
      if (reqCoords && dCoords && dCoords[0] !== 0) {
        distanceKm = haversineKm(reqCoords, dCoords);
        if (distanceKm <= 5) { score += 20; reasons.push('Within 5 km'); }
        else if (distanceKm <= 15) { score += 14; reasons.push('Within 15 km'); }
        else if (distanceKm <= 40) { score += 8; reasons.push('Within 40 km'); }
        else { score += 2; }
      } else if (d.city && request.city && d.city === request.city) {
        score += 14;
        distanceKm = null;
        reasons.push('Same city');
      }

      // Reliability (past responsiveness)
      const reliability = d.reliability ?? 80;
      score += (reliability / 100) * 12;
      if (reliability >= 90) reasons.push('Highly reliable donor');

      // Availability toggle
      if (d.available === false) { score -= 25; reasons.push('Currently unavailable'); }

      // Urgency nudges eligible+near donors up
      if (request.urgency === 'critical' && elig.eligible && distanceKm !== null && distanceKm <= 15) {
        score += 6;
      }

      return {
        donorId: d._id || d.id,
        name: d.name,
        phone: d.phone || null,
        bloodType: d.bloodType,
        city: d.city,
        distanceKm,
        eligible: elig.eligible,
        eligibleInDays: elig.daysRemaining,
        reliability,
        score: Math.round(Math.min(100, Math.max(0, score))),
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    request: { bloodType: request.bloodType, city: request.city, urgency: request.urgency },
    totalCompatible: scored.length,
    matches: scored.slice(0, 20),
    engine: 'rules',
  };
}

/* ─────────────────────── 2. ELIGIBILITY PRE-SCREENING ────────────────────── */
/**
 * `answers` is an object of yes/no + numeric health responses.
 * Returns a verdict (eligible | not_eligible | defer) with reasons & guidance —
 * mirrors how a blood bank screens donors, preventing wasted trips.
 */
export function screenEligibility(answers = {}) {
  const a = answers;
  const blockers = [];
  const deferrals = [];
  const notes = [];

  const age = Number(a.age);
  if (!Number.isNaN(age)) {
    if (age < 18) blockers.push('Must be at least 18 years old');
    if (age > 65) deferrals.push('Donors over 65 need physician clearance');
  }

  const weight = Number(a.weightKg);
  if (!Number.isNaN(weight) && weight < 50) blockers.push('Minimum weight is 50 kg');

  if (a.recentIllness) deferrals.push('Recent fever/illness — wait until fully recovered (typically 1–2 weeks)');
  if (a.recentTattoo) deferrals.push('Recent tattoo/piercing — defer 6 months');
  if (a.recentSurgery) deferrals.push('Recent major surgery — defer until cleared by doctor');
  if (a.pregnant) deferrals.push('Pregnant/recently delivered — defer (typically 6–12 months post-delivery)');
  if (a.recentDonationDays !== undefined && Number(a.recentDonationDays) < 90) {
    deferrals.push(`Last donation ${a.recentDonationDays} days ago — wait until 90 days`);
  }
  if (a.chronicCondition) deferrals.push('Chronic condition noted — needs medical review');
  if (a.medications) notes.push('Some medications affect eligibility — disclose at the centre');
  if (a.recentAlcohol) notes.push('Avoid alcohol 24h before donating');

  let verdict = 'eligible';
  if (blockers.length) verdict = 'not_eligible';
  else if (deferrals.length) verdict = 'defer';

  const confidence = blockers.length ? 0.95 : deferrals.length ? 0.7 : 0.85;

  const summary =
    verdict === 'eligible'
      ? 'Based on your answers, you appear eligible to donate. Final confirmation happens at the centre with a quick hemoglobin & vitals check.'
      : verdict === 'defer'
      ? 'You may need to wait before donating. Please review the points below.'
      : 'Unfortunately you are not currently eligible to donate.';

  return {
    verdict,
    confidence,
    summary,
    blockers,
    deferrals,
    notes,
    disclaimer: 'This is an informational pre-screen, not medical advice. The donation centre makes the final decision.',
    engine: 'rules',
  };
}

/* ─────────────────────────── 3. DEMAND FORECAST ─────────────────────────── */
/**
 * `history`: optional array of { bloodType, units } current stock snapshots.
 * Produces a 7-day risk outlook per blood type using stock level + a simple
 * consumption heuristic weighted by population demand of each type in India.
 */
const POP_DEMAND_WEIGHT = {
  'O+': 1.0, 'B+': 0.95, 'A+': 0.8, 'AB+': 0.5,
  'O-': 0.7, 'B-': 0.55, 'A-': 0.5, 'AB-': 0.35,
};

export function forecastDemand(city, history = []) {
  const byType = {};
  history.forEach((h) => { byType[h.bloodType] = (byType[h.bloodType] || 0) + (h.units || 0); });

  const types = Object.keys(POP_DEMAND_WEIGHT);
  const forecast = types.map((t) => {
    const stock = byType[t] ?? 0;
    const dailyBurn = Math.max(1, Math.round(POP_DEMAND_WEIGHT[t] * 18)); // est. daily units used
    const daysOfSupply = Math.round((stock / dailyBurn) * 10) / 10;

    let risk = 'stable';
    if (daysOfSupply < 2) risk = 'critical';
    else if (daysOfSupply < 5) risk = 'low';

    return {
      bloodType: t,
      currentStock: stock,
      estDailyUse: dailyBurn,
      daysOfSupply,
      risk,
      recommendation:
        risk === 'critical'
          ? 'Launch a targeted donor drive immediately'
          : risk === 'low'
          ? 'Schedule a donation camp this week'
          : 'Supply healthy — maintain routine collection',
    };
  }).sort((x, y) => x.daysOfSupply - y.daysOfSupply);

  return {
    city,
    horizonDays: 7,
    generatedAt: new Date().toISOString(),
    forecast,
    criticalTypes: forecast.filter((f) => f.risk === 'critical').map((f) => f.bloodType),
    engine: 'rules',
  };
}

/* ───────────────────────────── 4. REQUEST TRIAGE ────────────────────────── */
/**
 * Scores an incoming emergency 0-100 so coordinators handle the most
 * life-critical requests first. Factors: urgency, units needed, rarity of
 * blood type, and patient age extremes.
 */
export function triageRequest(request = {}) {
  let score = 0;
  const reasons = [];

  const urgencyScore = { critical: 45, urgent: 28, moderate: 12 }[request.urgency] ?? 20;
  score += urgencyScore;
  reasons.push(`Urgency: ${request.urgency || 'unknown'}`);

  const units = Number(request.units) || 1;
  if (units >= 5) { score += 20; reasons.push(`Large requirement (${units} units)`); }
  else if (units >= 3) { score += 12; reasons.push(`${units} units needed`); }
  else { score += 5; }

  // Rarer types are harder to source -> higher priority
  const compatibleDonorCount = donorsForRecipient(request.bloodType).length;
  if (compatibleDonorCount <= 2) { score += 18; reasons.push(`Rare type (${request.bloodType})`); }
  else if (compatibleDonorCount <= 4) { score += 10; reasons.push(`Limited donor pool for ${request.bloodType}`); }

  const age = Number(request.patientAge);
  if (!Number.isNaN(age) && (age <= 5 || age >= 70)) {
    score += 10;
    reasons.push('Vulnerable patient age');
  }

  score = Math.round(Math.min(100, score));
  const label = score >= 75 ? 'P1 — Immediate' : score >= 50 ? 'P2 — High' : score >= 30 ? 'P3 — Standard' : 'P4 — Routine';

  return { priorityScore: score, triageLabel: label, triageReasons: reasons, engine: 'rules' };
}

/* ── Emergency description writer (rule fallback) ───────────────────────────
 * Builds a clean, professional one-liner from the structured fields. The LLM
 * adapters override this with a richer, natural-language version.
 */
export function writeEmergencyDescription(d = {}) {
  const parts = [];
  if (d.units && d.bloodType) parts.push(`${d.units} unit(s) of ${d.bloodType} blood required`);
  if (d.hospital) parts.push(`at ${d.hospital}`);
  if (d.ward) parts.push(`(${d.ward})`);
  if (d.patientAge) parts.push(`for a ${d.patientAge}-year-old patient`);
  if (d.reason) parts.push(`— ${d.reason}`);
  if (d.urgency) parts.push(`. Urgency: ${d.urgency}.`);
  const text = parts.join(' ').replace(' .', '.').trim();
  return { description: text || 'Urgent blood requirement. Please respond if you can help.', engine: 'rules' };
}

/* ── Donor outreach message writer (rule fallback) ──────────────────────────*/
export function writeOutreachMessage(donor = {}, request = {}) {
  const name = donor.name ? donor.name.split(' ')[0] : 'there';
  const bt = request.bloodType || 'blood';
  const place = request.hospital || request.city || 'a nearby hospital';
  const msg =
    `Hi ${name}, this is an urgent request via RaktSetu. ` +
    `${bt} blood is needed at ${place}. ` +
    `Your blood type is a match. If you're available to donate, please respond as soon as you can. ` +
    `Every minute counts — thank you for being a lifesaver. 🩸`;
  return { message: msg, engine: 'rules' };
}

/* ── Conversational eligibility (rule fallback) ─────────────────────────────
 * Without an LLM we can't truly parse free text, so we return a friendly
 * prompt asking the user to use the form, plus a couple of keyword hints.
 */
export function eligibilityChat(message = '', _history = []) {
  const m = String(message).toLowerCase();
  const hints = [];
  if (/(fever|cold|flu|ill|sick|infection)/.test(m)) hints.push('Recent illness usually means waiting until you are fully recovered (often ~2 weeks).');
  if (/(tattoo|piercing)/.test(m)) hints.push('A recent tattoo or piercing typically defers donation for up to 6 months.');
  if (/(pregnan|delivery|deliver)/.test(m)) hints.push('Pregnancy and recent delivery defer donation until cleared by a doctor.');
  if (/(alcohol|drink|drunk)/.test(m)) hints.push('Avoid donating within 24 hours of drinking alcohol.');
  if (/(weight|kg)/.test(m)) hints.push('Donors usually need to weigh at least 50 kg.');
  if (/(age|years old|year old)/.test(m)) hints.push('Eligible age is generally 18–65.');
  const base = hints.length
    ? hints.join(' ')
    : 'I can help check your eligibility. For a precise result, try the form, or tell me your age, weight, last donation date, and any recent illness, tattoo, surgery, pregnancy, or medication.';
  return { answer: `${base} (Informational only — not medical advice.)`, engine: 'rules' };
}