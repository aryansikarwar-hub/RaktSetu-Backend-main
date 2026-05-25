/**
 * GROQ ENGINE ADAPTER  (active when AI_MODE=groq)
 * ───────────────────────────────────────────────────────────────────────────
 * Calls the Groq Cloud API (OpenAI-compatible) directly over `fetch` (Node 18+),
 * so it needs NO extra npm packages. Just:
 *   1) set AI_MODE=groq and GROQ_API_KEY=gsk_... in .env
 *   2) (optional) set GROQ_MODEL (default llama-3.3-70b-versatile)
 *   3) restart the server
 *
 * Get a FREE API key (no credit card) at: https://console.groq.com/keys
 *
 * Returns the SAME JSON shape as the rules engine, and if the key is missing or
 * any request fails, it transparently falls back to the deterministic rule
 * engine — the app NEVER breaks.
 */
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import * as rules from './rulesEngine.js';
import { KNOWLEDGE_BASE } from '../knowledgeBase.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function hasKey() {
  return Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim());
}

/**
 * Low-level call to Groq. `wantJson` asks the model to return strict JSON.
 * Throws on any failure so callers can fall back to rules.
 */
async function complete(system, user, { wantJson = false, history = [] } = {}) {
  if (!hasKey()) throw new Error('GROQ_API_KEY is not set');

  const messages = [{ role: 'system', content: system }];
  for (const h of history) {
    const role = h.role === 'user' ? 'user' : 'assistant';
    const content = h.text || h.content || '';
    if (content) messages.push({ role, content });
  }
  messages.push({ role: 'user', content: user });

  const body = {
    model: env.GROQ_MODEL,
    messages,
    temperature: wantJson ? 0.2 : 0.5,
    max_tokens: 700,
  };
  if (wantJson) body.response_format = { type: 'json_object' };

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Groq returned an empty response');
  return text;
}

function parseJson(text) {
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
    return { ...rules.screenEligibility(answers), ...out };
  } catch (err) {
    logger.warn(`groq.screenEligibility fell back to rules: ${err.message}`);
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
      engine: 'groq',
    };
  } catch (err) {
    logger.warn(`groq.chat fell back to rules-rag: ${err.message}`);
    const rag = await import('./chatRagEngine.js');
    return rag.chat(question, context);
  }
}

/* ── Emergency description writer (LLM) ─────────────────────────────────────*/
export async function writeEmergencyDescription(details = {}) {
  try {
    const system =
      'You write short, professional blood-emergency descriptions for an Indian blood-donation app. ' +
      'Given structured fields, produce ONE clear, urgent, compassionate sentence (max 2 sentences) that a hospital would post to alert donors. ' +
      'No markdown, no preamble — just the description text.';
    const user = `Fields (JSON): ${JSON.stringify(details)}`;
    const description = (await complete(system, user)).trim();
    return { description, engine: 'groq' };
  } catch (err) {
    logger.warn(`groq.writeEmergencyDescription fell back to rules: ${err.message}`);
    return rules.writeEmergencyDescription(details);
  }
}

/* ── Donor outreach message writer (LLM) ────────────────────────────────────*/
export async function writeOutreachMessage(donor = {}, request = {}) {
  try {
    const system =
      'You write short, warm, personalized WhatsApp messages asking a blood donor to help with an urgent request in India. ' +
      'Be respectful and motivating, mention their first name and the hospital/city, keep it under 50 words, and end with gratitude. ' +
      'No markdown, no preamble — just the message text.';
    const user = `Donor (JSON): ${JSON.stringify(donor)}\nRequest (JSON): ${JSON.stringify(request)}`;
    const message = (await complete(system, user)).trim();
    return { message, engine: 'groq' };
  } catch (err) {
    logger.warn(`groq.writeOutreachMessage fell back to rules: ${err.message}`);
    return rules.writeOutreachMessage(donor, request);
  }
}

/* ── Conversational eligibility (LLM) ───────────────────────────────────────*/
export async function eligibilityChat(message, history = []) {
  try {
    const system =
      'You are a friendly blood-donation eligibility assistant for India. The user describes their situation in plain language. ' +
      'Assess whether they can likely donate, ask a brief follow-up if key info is missing (age, weight, last donation, recent illness/tattoo/surgery/pregnancy/medication/alcohol). ' +
      'Use Indian blood-bank norms (age 18-65, weight >=50kg, 90-day gap for whole blood, defer for recent illness/tattoo/pregnancy). ' +
      'Be warm, concise (2-4 sentences), and ALWAYS end with "Informational only — not medical advice." Never give a hard medical diagnosis.';
    const answer = await complete(system, message, { history });
    return { answer: answer.trim(), engine: 'groq' };
  } catch (err) {
    logger.warn(`groq.eligibilityChat fell back to rules: ${err.message}`);
    return rules.eligibilityChat(message, history);
  }
}