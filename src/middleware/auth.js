import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo, safeUser } from '../services/repository.js';

export function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/** Require a valid Bearer token; attaches req.user. */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await repo.findUserById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });

    req.user = safeUser(user);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Restrict to specific roles, e.g. restrictTo('admin','coordinator'). */
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

/** Optional auth: attaches req.user if a token is present, else continues. */
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await repo.findUserById(decoded.id);
      if (user) req.user = safeUser(user);
    }
  } catch {
    /* ignore — anonymous request */
  }
  next();
}
