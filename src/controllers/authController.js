import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { repo, safeUser } from '../services/repository.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { cityCoords } from '../utils/geo.js';
import { createOtp, verifyOtp } from '../services/otpStore.js';
import { sendSms, sendEmail } from '../services/comm.js';

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return false;
  }
  return true;
}

export const register = asyncHandler(async (req, res) => {
  if (!checkValidation(req, res)) return;
  const {
    name, email, password, bloodType, city, phone, role,
    hospitalName, licenseNumber, designation,
  } = req.body;

  const allowedRole = ['donor', 'hospital', 'admin'].includes(role) ? role : 'donor';

  // Role-specific required fields
  if (allowedRole === 'donor' && !bloodType) {
    return res.status(422).json({ success: false, message: 'Blood type is required for donors' });
  }
  if (allowedRole === 'hospital' && !hospitalName) {
    return res.status(422).json({ success: false, message: 'Hospital name is required' });
  }

  const existing = await repo.findUserByEmail(email);
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

  const coords = cityCoords(city);
  const user = await repo.createUser({
    name, email, password, city, phone,
    role: allowedRole,
    bloodType: allowedRole === 'donor' ? bloodType : undefined,
    hospitalName: allowedRole === 'hospital' ? hospitalName : undefined,
    licenseNumber: allowedRole === 'hospital' ? licenseNumber : undefined,
    designation: allowedRole === 'hospital' ? designation : undefined,
    location: coords ? { type: 'Point', coordinates: coords } : undefined,
  });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: safeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  if (!checkValidation(req, res)) return;
  const { email, password } = req.body;

  const user = await repo.findUserByEmail(email, true);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ success: true, token, user: safeUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Send a numeric OTP to a phone number or email for login.
export const sendOtp = asyncHandler(async (req, res) => {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ success: false, message: 'to is required' });

  const isEmail = String(to || '').includes('@');
  const user = isEmail ? await repo.findUserByEmail(to) : await repo.findUserByPhone(to);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000);
  const created = createOtp(to, { code, ttl: 300, userId: String(user._id || user.id) });
  if (!created || created.ok === false) {
    return res.status(429).json({ success: false, message: 'Rate limit exceeded. Try again later.' });
  }

  if (isEmail) {
    await sendEmail(to, 'Your RaktSetu login code', `Your one-time code is: ${code}`);
  } else {
    await sendSms(to, `Your RaktSetu login code: ${code}`);
  }

  return res.json({ success: true, message: 'OTP sent' });
});

export const verifyOtpAndLogin = asyncHandler(async (req, res) => {
  const { to, code } = req.body || {};
  if (!to || !code) return res.status(400).json({ success: false, message: 'to and code are required' });
  const v = verifyOtp(to, code);
  if (!v.ok) return res.status(400).json({ success: false, message: `OTP ${v.reason}` });
  const user = await repo.findUserById(v.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const token = signToken(user);
  return res.json({ success: true, token, user: safeUser(user) });
});
