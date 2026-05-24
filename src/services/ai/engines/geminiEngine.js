/**
 * GOOGLE GEMINI ENGINE ADAPTER  (active when AI_MODE=gemini)
 * ───────────────────────────────────────────────────────────────────────────
 * Calls the Google Generative Language API (Gemini) directly over `fetch`
 * (Node 18+), so it needs NO extra npm packages. Just:
 *   1) set AI_MODE=gemini and GEMINI_API_KEY=... in .env
 *   2) (optional) set GEMINI_MODEL (default gemini-1.5-flash)
 *   3) restart the server
 *
 * Get a free API key at: https://aistudio.google.com/app/apikey
 *
 * Returns the SAME JSON shape as the rules engine, and if the key is missing or
 * any request fails, it transparently falls back to the deterministic rule
 * engine — the app NEVER breaks.
 */
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import * as rules from './rulesEngine.js';
import { KNOWLEDGE_BASE } from '../knowledgeBase.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function hasKey() {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());
}

/**
 * Low-level call to Gemini. `wantJson` asks the model to return strict JSON.
 * `history` is optional prior chat turns. Throws on any failure so callers can
 * fall back to rules.
 */
async function complete(system, user, { wantJson = false, history = [] } = {}) {
  if (!hasKey()) throw new Error('GEMINI_API_KEY is not set');

  // Gemini uses "contents" with roles "user" / "model". The system instruction
  // is passed separately via system_instruction.
  const contents = [];
  for (const h of history) {
    const role = h.role === 'user' ? 'user' : 'model';
    const text = h.text || h.content || '';
    if (text) contents.push({ role, parts: [{ text }] });
  }
  contents.push({ role: 'user', parts: [{ text: user }] });

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature: wantJson ? 0.2 : 0.5,
      maxOutputTokens: 700,
      ...(wantJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const url = `${GEMINI_BASE}/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

function parseJson(text) {
  // Be forgiving: strip markdown fences if the model added them.
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

/* ── Donor matching: keep deterministic (latency-sensitive, rules are strong) ── */
export async function matchDonors(request, donors) {
  return rules.matchDonors(request, donors);
}

/* ── Eligibility screening ── */
export async function screenEligibility(answers) {
  try {
    const system =
      'You are a blood-donation eligibility screener for India. Given the applicant answers, decide eligibility. ' +
      'Reply ONLY with strict JSON: {"eligible":boolean,"status":"eligible"|"deferred"|"ineligible","reasons":string[],"waitDays":number,"advice":string}. ' +
      'Use Indian blood-bank norms (age 18-65, weight >=50kg, 90-day gap for whole blood, defer for recent illness/tattoo/pregnancy).';
    const user = `Applicant answers (JSON): ${JSON.stringify(answers)}`;
    const out = parseJson(await complete(system, user, { wantJson: true }));
    // Merge with rules result to guarantee all expected fields exist.
    return { ...rules.screenEligibility(answers), ...out };
  } catch (err) {
    logger.warn(`gemini.screenEligibility fell back to rules: ${err.message}`);
    return rules.screenEligibility(answers);
  }
}

/* ── Demand forecasting (numeric/statistical → keep deterministic) ── */
export async function forecastDemand(city, history) {
  return rules.forecastDemand(city, history);
}

/* ── Triage ── */
export async function triageRequest(request) {
  return rules.triageRequest(request);
}

/* ── RAG chatbot: real LLM grounded in KB + live data ── */
export async function chat(question, context = {}) {
  const { live = {}, history = [] } = context;
  try {
    // Retrieve a compact knowledge slice to ground the model (RAG).
    const kb = KNOWLEDGE_BASE.map((e) => `• [${e.topic}] ${e.answer}`).join('\n');

    const liveFacts = [];
    if (live.openEmergencies != null) liveFacts.push(`Open emergencies: ${live.openEmergencies}`);
    if (live.topEmergency) liveFacts.push(`Top emergency: ${live.topEmergency.units} units of ${live.topEmergency.bloodType} at ${live.topEmergency.hospital}, ${live.topEmergency.city}`);
    if (live.donors != null) liveFacts.push(`Registered donors: ${live.donors}`);
    if (live.hospitals != null) liveFacts.push(`Partner hospitals: ${live.hospitals}, tracked units: ${live.totalUnits || 0}`);

    const system =
      'You are the RaktSetu assistant, a friendly, concise helper for a blood-donation network in India. ' +
      'Answer ONLY using the knowledge base and live data provided below. If the question is outside blood donation / RaktSetu, politely say you can only help with those topics. ' +
      'Keep answers short (2-4 sentences), warm, and practical. Never give medical diagnoses — add "informational only, not medical advice" when relevant.\n\n' +
      `KNOWLEDGE BASE:\n${kb}\n\n` +
      `LIVE DATA:\n${liveFacts.length ? liveFacts.join('\n') : 'none'}`;

    const answer = await complete(system, question, { history });
    return {
      answer: answer.trim(),
      sources: [],
      usedLive: liveFacts.length > 0,
      engine: 'gemini',
    };
  } catch (err) {
    logger.warn(`gemini.chat fell back to rules-rag: ${err.message}`);
    const rag = await import('./chatRagEngine.js');
    return rag.chat(question, context);
  }
}