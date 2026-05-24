/**
 * REPOSITORY LAYER
 * Controllers call these functions and never care whether data lives in
 * MongoDB or the in-memory mock store. Flipping USE_MOCK swaps the backend
 * with no controller changes.
 */
import { env } from '../config/env.js';
import { mock } from './mockStore.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Notification from '../models/Notification.js';

const MOCK = env.USE_MOCK;

/* ── Users ── */
export const repo = {
  async findUserByEmail(email, withPassword = false) {
    if (MOCK) return mock.findUserByEmail(email);
    const q = User.findOne({ email: email.toLowerCase() });
    if (withPassword) q.select('+password');
    return q.exec();
  },

  async findUserById(id) {
    if (MOCK) return mock.findUserById(id);
    return User.findById(id).exec();
  },

  async createUser(data) {
    if (MOCK) return mock.createUser(data);
    return User.create(data);
  },

  async listDonors(filter = {}) {
    if (MOCK) return mock.listDonors(filter);
    const q = { role: 'donor' };
    if (filter.bloodType) q.bloodType = filter.bloodType;
    if (filter.city) q.city = filter.city;
    if (filter.available !== undefined) q.available = filter.available;
    return User.find(q).limit(200).exec();
  },

  async updateUser(id, patch) {
    if (MOCK) return mock.updateUser(id, patch);
    return User.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  /* ── Hospitals ── */
  async listHospitals(city) {
    if (MOCK) return mock.listHospitals(city);
    return Hospital.find(city ? { city } : {}).limit(100).exec();
  },

  async findHospitalById(id) {
    if (MOCK) return mock.findHospitalById(id);
    return Hospital.findById(id).exec();
  },

  /* ── Emergencies ── */
  async listEmergencies(filter = {}) {
    if (MOCK) return mock.listEmergencies(filter);
    const q = {};
    if (filter.status) q.status = filter.status;
    if (filter.city) q.city = filter.city;
    return EmergencyRequest.find(q).sort({ priorityScore: -1, createdAt: -1 }).limit(100).exec();
  },

  async createEmergency(data) {
    if (MOCK) return mock.createEmergency(data);
    return EmergencyRequest.create(data);
  },

  async findEmergencyById(id) {
    if (MOCK) return mock.findEmergencyById(id);
    return EmergencyRequest.findById(id).exec();
  },

  async updateEmergency(id, patch) {
    if (MOCK) return mock.updateEmergency(id, patch);
    return EmergencyRequest.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  /* ── Notifications ── */
  async listNotifications(userId) {
    if (MOCK) return mock.listNotifications(userId);
    return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(20).exec();
  },

  /* ── Stats ── */
  async stats() {
    if (MOCK) return mock.stats();
    const [donors, hospitals, openEmergencies] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      Hospital.countDocuments(),
      EmergencyRequest.countDocuments({ status: 'open' }),
    ]);
    const hospitalsList = await Hospital.find({}, 'inventory').exec();
    const totalUnits = hospitalsList.reduce(
      (sum, h) => sum + h.inventory.reduce((s, i) => s + i.units, 0), 0);
    return { donors, hospitals, openEmergencies, totalUnits };
  },
};

/** Normalise a user/doc to a plain safe object (no password) for responses. */
export function safeUser(u) {
  if (!u) return null;
  const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  delete obj.password;
  return obj;
}
