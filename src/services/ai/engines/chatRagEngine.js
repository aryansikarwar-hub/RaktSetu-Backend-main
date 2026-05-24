/**
 * RAG CHATBOT ENGINE (rules mode)
 * Retrieval-Augmented Generation, the deterministic way:
 *   1. RETRIEVE the most relevant knowledge-base entries for the question
 *      (keyword + token overlap scoring).
 *   2. AUGMENT with live app data when the question is about current state
 *      (open emergencies, donor counts, hospital stock).
 *   3. GENERATE a grounded answer from those sources, with citations.
 *
 * This file defines the exact response shape the LLM adapters must also return,
 * so switching AI_MODE to openai/anthropic needs zero changes elsewhere. The
 * retrieved context is exactly what you'd feed an LLM as grounding.
 */
import { KNOWLEDGE_BASE } from '../knowledgeBase.js';

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'i', 'can', 'to', 'of', 'for', 'how', 'what', 'who', 'my', 'me', 'in', 'on', 'and', 'or', 'be', 'it', 'this', 'that', 'with']);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s−-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

/** Score each KB entry against the question; return top matches. */
function retrieve(question, k = 3) {
  const qTokens = tokenize(question);
  const qLower = question.toLowerCase();
  const qTokenSet = new Set(qTokens);

  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    // phrase keyword hits (strongest signal)
    for (const kw of entry.keywords) {
      if (qLower.includes(kw)) score += kw.split(' ').length >= 2 ? 6 : 3;
      // partial: keyword token present in question
      else if (kw.split(' ').every((t) => qTokenSet.has(t)) && kw.includes(' ')) score += 2;
    }
    // token overlap with keywords only (answer overlap is noisy, weight low)
    const kwTokens = new Set(entry.keywords.join(' ').split(' '));
    for (const t of qTokens) if (kwTokens.has(t)) score += 1.5;
    return { entry, score };
  })
    .filter((s) => s.score >= 2) // threshold: ignore weak/off-topic matches
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
}

/** Build live-data context if the question asks about current state. */
function liveContext(question, live = {}) {
  const q = question.toLowerCase();
  const facts = [];
  if (/emergenc|urgent|right now|currently|active|open request/.test(q) && live.openEmergencies != null) {
    facts.push(`There are currently ${live.openEmergencies} open emergency request(s) on the network.`);
    if (live.topEmergency) {
      facts.push(`The highest-priority one needs ${live.topEmergency.units} unit(s) of ${live.topEmergency.bloodType} at ${live.topEmergency.hospital}, ${live.topEmergency.city}.`);
    }
  }
  if (/how many donor|donor count|registered|total donor/.test(q) && live.donors != null) {
    facts.push(`RaktSetu currently has ${live.donors.toLocaleString('en-IN')} registered donors.`);
  }
  if (/hospital|blood bank|stock|inventory|units available/.test(q) && live.hospitals != null) {
    facts.push(`There are ${live.hospitals} verified partner hospitals, with about ${(live.totalUnits || 0).toLocaleString('en-IN')} units in tracked inventory.`);
  }
  return facts;
}

/**
 * Main entry. `history` is optional prior turns (kept for LLM mode parity).
 * Returns { answer, sources, suggestions, usedLive, engine }.
 */
export function chat(question, { live = {}, history = [] } = {}) {
  void history;
  const retrieved = retrieve(question, 3);
  const live_facts = liveContext(question, live);

  let answer;
  const sources = retrieved.map((r) => ({ id: r.entry.id, topic: r.entry.topic }));

  if (retrieved.length === 0 && live_facts.length === 0) {
    answer =
      "I’m not certain about that one. I can help with blood-donation eligibility, compatibility, how to donate, posting emergencies, finding donors, and using RaktSetu. Try rephrasing, or ask one of the suggested questions.";
  } else {
    const parts = [];
    if (live_facts.length) parts.push(live_facts.join(' '));
    // Use the single best KB entry as the primary grounded answer, then add a
    // secondary pointer if a clearly different second topic is relevant.
    if (retrieved[0]) parts.push(retrieved[0].entry.answer);
    if (retrieved[1] && retrieved[1].entry.topic !== retrieved[0].entry.topic && retrieved[1].score >= 3) {
      parts.push(retrieved[1].entry.answer);
    }
    answer = parts.join('\n\n');
  }

  return {
    answer,
    sources,
    usedLive: live_facts.length > 0,
    engine: 'rules-rag',
  };
}
