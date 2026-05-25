/**
 * ───────────────────────────────────────────────────────────────────────────
 *  AI PROVIDER ABSTRACTION  —  the single place AI behaviour is decided.
 * ───────────────────────────────────────────────────────────────────────────
 *
 *  WHY THIS EXISTS
 *  The whole app talks to AI through ONE interface (`ai`). Today it runs a
 *  fast, free, deterministic *rule-based* engine. Tomorrow you flip
 *  AI_MODE=openai or AI_MODE=gemini in .env, drop in an API key, and every
 *  feature (donor match, eligibility chat, forecasting, triage) upgrades to a
 *  real LLM — WITHOUT touching controllers, routes, or the frontend.
 *
 *  Each engine exposes the SAME function signature in every mode, so callers
 *  never branch on the provider. That is the contract that makes it
 *  future-proof.
 *
 *  To add a real LLM later you only implement the `llm.complete()` call inside
 *  the openai/gemini branches below — the rule engines already define the
 *  exact JSON shape the rest of the app expects, so you can even use them as
 *  the LLM's response schema / validation fallback.
 */
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import * as rules from './engines/rulesEngine.js';
import * as chatRag from './engines/chatRagEngine.js';
// LLM adapters are imported lazily so the app runs with zero AI deps installed.

const MODE = env.AI_MODE; // 'rules' | 'openai' | 'gemini' | 'groq'

let llmAdapter = null;
async function getLLM() {
  if (llmAdapter) return llmAdapter;
  if (MODE === 'openai') {
    llmAdapter = await import('./engines/openaiEngine.js');
  } else if (MODE === 'gemini') {
    llmAdapter = await import('./engines/geminiEngine.js');
  } else if (MODE === 'groq') {
    llmAdapter = await import('./engines/groqEngine.js');
  }
  return llmAdapter;
}

/**
 * Generic helper: try the configured LLM; if it fails or isn't configured,
 * gracefully fall back to the deterministic rule engine. This guarantees the
 * app NEVER breaks just because an API key is missing or a request errors.
 */
async function withFallback(llmFn, rulesFn, ...args) {
  if (MODE === 'rules') return rulesFn(...args);
  try {
    const adapter = await getLLM();
    if (!adapter || typeof adapter[llmFn] !== 'function') return rulesFn(...args);
    return await adapter[llmFn](...args);
  } catch (err) {
    logger.warn(`AI(${MODE}).${llmFn} failed, using rules fallback: ${err.message}`);
    return rulesFn(...args);
  }
}

export const ai = {
  mode: MODE,

  /** Rank candidate donors for an emergency request. */
  matchDonors: (request, donors) =>
    withFallback('matchDonors', rules.matchDonors, request, donors),

  /** Conversational / structured eligibility screening from health answers. */
  screenEligibility: (answers) =>
    withFallback('screenEligibility', rules.screenEligibility, answers),

  /** Forecast which blood types will run critical for a city. */
  forecastDemand: (city, history) =>
    withFallback('forecastDemand', rules.forecastDemand, city, history),

  /** Assign a priority score + reasons to an incoming emergency request. */
  triageRequest: (request) =>
    withFallback('triageRequest', rules.triageRequest, request),

  /** RAG chatbot — grounded answer from knowledge base + live data. */
  chat: (question, context) =>
    withFallback('chat', chatRag.chat, question, context),
};

logger.info(`AI layer initialised in "${MODE}" mode.`);