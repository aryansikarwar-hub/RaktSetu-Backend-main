/**
 * ANTHROPIC (CLAUDE) ENGINE ADAPTER  (active when AI_MODE=anthropic)
 *
 * To go live:
 *   1) npm install @anthropic-ai/sdk
 *   2) set AI_MODE=anthropic and ANTHROPIC_API_KEY in .env
 *   3) uncomment the import + the real call below
 *
 * Returns the same JSON shape as the rules engine; falls back automatically.
 */
import { env } from '../../../config/env.js';
import * as rules from './rulesEngine.js';

// import Anthropic from '@anthropic-ai/sdk';
// const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function complete(_system, _user) {
  // const res = await client.messages.create({
  //   model: env.ANTHROPIC_MODEL,
  //   max_tokens: 1024,
  //   system: _system,
  //   messages: [{ role: 'user', content: _user }],
  // });
  // return JSON.parse(res.content[0].text);
  throw new Error('Anthropic adapter not yet wired — install @anthropic-ai/sdk and uncomment.');
}

export async function matchDonors(request, donors) {
  void complete;
  return rules.matchDonors(request, donors);
}
export async function screenEligibility(answers) {
  return rules.screenEligibility(answers);
}
export async function forecastDemand(city, history) {
  return rules.forecastDemand(city, history);
}
export async function triageRequest(request) {
  return rules.triageRequest(request);
}

export async function chat(question, context) {
  // In LLM mode you would retrieve KB + live context (see chatRagEngine) and
  // pass it as grounding to the model, then return { answer, sources, usedLive }.
  const rag = await import('./chatRagEngine.js');
  return rag.chat(question, context);
}
