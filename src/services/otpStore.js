import { env } from '../config/env.js';

let createOtp;
let verifyOtp;
let peekOtp;

if (env.USE_REDIS_OTP) {
  // Use Redis-backed implementation when enabled. Dynamic import keeps startup safe when ioredis is not configured.
  // eslint-disable-next-line import/no-unresolved
  const delegate = await import('./otpRedis.js');
  createOtp = delegate.createOtp;
  verifyOtp = delegate.verifyOtp;
  peekOtp = delegate.peekOtp;
} else {
  // In-memory fallback
  const otps = new Map(); // key -> { code, expiresAt, userId }
  const sendLog = new Map(); // key -> [ timestamps ]
  const makeKey = (contact) => String(contact).toLowerCase().trim();

  createOtp = function createOtpLocal(contact, { code, ttl = 300, userId = null } = {}) {
    const key = makeKey(contact);
    // rate-limit: max 5 sends per hour per contact
    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const maxSends = 5;
    const logs = sendLog.get(key) || [];
    const recent = logs.filter((t) => now - t < windowMs);
    if (recent.length >= maxSends) return { ok: false, reason: 'rate_limited' };
    recent.push(now);
    sendLog.set(key, recent);

    const expiresAt = now + ttl * 1000;
    otps.set(key, { code: String(code), expiresAt, userId });
    // schedule cleanup
    setTimeout(() => { const v = otps.get(key); if (v && v.expiresAt <= Date.now()) otps.delete(key); }, ttl * 1000 + 1000);
    return { ok: true };
  };

  verifyOtp = function verifyOtpLocal(contact, code) {
    const key = makeKey(contact);
    const data = otps.get(key);
    if (!data) return { ok: false, reason: 'not_found' };
    if (Date.now() > data.expiresAt) { otps.delete(key); return { ok: false, reason: 'expired' }; }
    if (String(code) !== String(data.code)) return { ok: false, reason: 'mismatch' };
    otps.delete(key);
    return { ok: true, userId: data.userId };
  };

  peekOtp = function peekOtpLocal(contact) {
    return otps.get(makeKey(contact));
  };
}

export { createOtp, verifyOtp, peekOtp };
export default { createOtp, verifyOtp, peekOtp };
