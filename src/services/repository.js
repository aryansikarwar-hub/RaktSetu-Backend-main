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
import Donation from '../models/Donation.js';
import Booking from '../models/Booking.js';
import CommTemplate from '../models/CommTemplate.js';
import AuditLog from '../models/AuditLog.js';
import CommJob from '../models/CommJob.js';

const MOCK = env.USE_MOCK;

/* ── Users ── */
export const repo = {
  async findUserByEmail(email, withPassword = false) {
    if (MOCK) return mock.findUserByEmail(email);
    const q = User.findOne({ email: email.toLowerCase() });
    if (withPassword) q.select('+password');
    return q.exec();
  },

  async findUserByPhone(phone) {
    if (MOCK) return mock.findUserByPhone(phone);
    return User.findOne({ phone: phone }).exec();
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

  /* ── Donations ── */
  async listDonationsByDonor(donorId) {
    if (MOCK) return mock.listDonationsByDonor(donorId);
    return Donation.find({ donor: donorId }).sort({ date: -1 }).limit(100).lean().exec();
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

  async updateHospitalInventory(hospitalId, inventory) {
    if (MOCK) return mock.updateHospitalInventory(hospitalId, inventory);
    return Hospital.findByIdAndUpdate(hospitalId, { inventory }, { new: true }).exec();
  },

  async createBooking(data) {
    if (MOCK) return mock.createBooking(data);
    return Booking.create(data);
  },

  async listBookingsForHospital(hospitalId) {
    if (MOCK) return mock.listBookingsForHospital(hospitalId);
    return Booking.find({ hospital: hospitalId }).sort({ slotAt: 1 }).limit(200).exec();
  },

  async listBookingsForDonor(donorId) {
    if (MOCK) return mock.listBookingsForDonor(donorId);
    return Booking.find({ donor: donorId }).sort({ slotAt: -1 }).limit(200).exec();
  },

  async updateBooking(id, patch) {
    if (MOCK) return mock.updateBooking(id, patch);
    return Booking.findByIdAndUpdate(id, patch, { new: true }).exec();
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

  async createNotification(userId, data) {
    if (MOCK) return mock.createNotification(userId, data);
    const payload = { user: userId, ...data };
    return Notification.create(payload);
  },

  async updateNotificationRead(id, read = true) {
    if (MOCK) return mock.updateNotificationRead(id, read);
    return Notification.findByIdAndUpdate(id, { read }, { new: true }).exec();
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

  /* ── Comm templates ── */
  async listCommTemplates(filter = {}) {
    if (MOCK) return mock.listCommTemplates(filter);
    const q = {};
    if (filter.channel) q.channel = filter.channel;
    if (filter.name) q.name = { $regex: filter.name, $options: 'i' };
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return CommTemplate.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  },

  async countCommTemplates(filter = {}) {
    if (MOCK) return mock.listCommTemplates(filter).length;
    const q = {};
    if (filter.channel) q.channel = filter.channel;
    if (filter.name) q.name = { $regex: filter.name, $options: 'i' };
    return CommTemplate.countDocuments(q).exec();
  },

  async findCommTemplateById(id) {
    if (MOCK) return mock.findCommTemplateById(id);
    return CommTemplate.findById(id).exec();
  },

  async createCommTemplate(data) {
    if (MOCK) return mock.createCommTemplate(data);
    return CommTemplate.create(data);
  },

  async updateCommTemplate(id, patch) {
    if (MOCK) return mock.updateCommTemplate(id, patch);
    return CommTemplate.findByIdAndUpdate(id, patch, { new: true }).exec();
  },

  async deleteCommTemplate(id) {
    if (MOCK) return mock.deleteCommTemplate(id);
    const r = await CommTemplate.findByIdAndDelete(id).exec();
    return Boolean(r);
  },
  async listAdmins() {
    if (MOCK) return mock.listAdmins();
    return User.find({ role: { $in: ['admin', 'coordinator'] } }, '_id').exec();
  },
  async createAuditLog(payload) {
    if (MOCK) return mock.createAuditLog(payload);
    return AuditLog.create(payload);
  },
  async createCommJob(payload) {
    if (MOCK) return mock.createCommJob(payload);
    return CommJob.create(payload);
  },
  async fetchPendingCommJobs(limit = 20) {
    if (MOCK) return mock.fetchPendingCommJobs(limit);
    const now = new Date();
    return CommJob.find({ status: 'pending', nextAttemptAt: { $lte: now } }).sort({ createdAt: 1 }).limit(limit).exec();
  },
  async markCommJob(id, patch) {
    if (MOCK) return mock.markCommJob(id, patch);
    return CommJob.findByIdAndUpdate(id, patch, { new: true }).exec();
  },
  async listCommJobs(filter = {}) {
    if (MOCK) return mock.listCommJobs(filter);
    const q = {};
    if (filter.status) q.status = filter.status;
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return CommJob.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  },
  async countCommJobs(filter = {}) {
    if (MOCK) return mock.listCommJobs(filter).length;
    const q = {};
    if (filter.status) q.status = filter.status;
    return CommJob.countDocuments(q).exec();
  },
  async listAuditLogs(filter = {}) {
    if (MOCK) return mock.listAuditLogs(filter);
    const q = {};
    if (filter.target) q.target = filter.target;
    if (filter.targetId) q.targetId = filter.targetId;
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  },
  async countAuditLogs(filter = {}) {
    if (MOCK) return mock.listAuditLogs(filter).length;
    const q = {};
    if (filter.target) q.target = filter.target;
    if (filter.targetId) q.targetId = filter.targetId;
    return AuditLog.countDocuments(q).exec();
  },
};

/** Normalise a user/doc to a plain safe object (no password) for responses. */
export function safeUser(u) {
  if (!u) return null;
  const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  delete obj.password;
  return obj;
}