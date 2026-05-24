/**
 * OPENAI ENGINE ADAPTER  (active when AI_MODE=openai)
 *
 * This file is intentionally dependency-free until you enable it. To go live:
 *   1) npm install openai
 *   2) set AI_MODE=openai and OPENAI_API_KEY in .env
 *   3) uncomment the import + the real call below
 *
 * Each function MUST return the same JSON shape as the rules engine so the
 * rest of the app keeps working unchanged. If anything throws, index.js
 * automatically falls back to the rule engine.
 */
import { env } from '../../../config/env.js';
import * as rules from './rulesEngine.js';

// import OpenAI from 'openai';
// const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function complete(_system, _user) {
  // const res = await client.chat.completions.create({
  //   model: env.OPENAI_MODEL,
  //   messages: [{ role: 'system', content: _system }, { role: 'user', content: _user }],
  //   response_format: { type: 'json_object' },
  // });
  // return JSON.parse(res.choices[0].message.content);
  throw new Error('OpenAI adapter not yet wired — install `openai` and uncomment the call.');
}

export async function matchDonors(request, donors) {
  // Example: let the LLM re-rank with nuanced reasoning, validated against rules shape.
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
