import Redis from 'ioredis';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL);

function makeKey(contact) {
  return `otp:${String(contact).toLowerCase().trim()}`;
}

function sendCountKey(contact) {
  return `otp:sent:${String(contact).toLowerCase().trim()}`;
}

export async function createOtp(contact, { code, ttl = 300, userId = null } = {}) {
  const sendKey = sendCountKey(contact);
  const maxSends = 5;
  const windowSec = 60 * 60; // 1 hour

  try {
    // atomically increment send count
    const sends = await redis.incr(sendKey);
    if (sends === 1) await redis.expire(sendKey, windowSec);
    if (sends > maxSends) return { ok: false, reason: 'rate_limited' };

    const key = makeKey(contact);
    const payload = JSON.stringify({ code: String(code), userId });
    await redis.set(key, payload, 'EX', ttl);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'redis_error', error: String(err) };
  }
}

export async function verifyOtp(contact, code) {
  try {
    const key = makeKey(contact);
    const v = await redis.get(key);
    if (!v) return { ok: false, reason: 'not_found' };
    const data = JSON.parse(v);
    if (String(data.code) !== String(code)) return { ok: false, reason: 'mismatch' };
    await redis.del(key);
    return { ok: true, userId: data.userId };
  } catch (err) {
    return { ok: false, reason: 'redis_error', error: String(err) };
  }
}

export async function peekOtp(contact) {
  const key = makeKey(contact);
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
}

export default { createOtp, verifyOtp, peekOtp };
