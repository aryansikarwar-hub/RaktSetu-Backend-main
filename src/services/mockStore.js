/**
 * IN-MEMORY MOCK STORE  (active when USE_MOCK=true)
 * Mirrors the shape of the Mongoose documents so the repository layer can
 * serve identical data whether or not MongoDB is connected. Lets the app
 * boot and deploy a live preview with ZERO database setup.
 * Data resets on restart — perfect for demos, not for production.
 */
import bcrypt from 'bcryptjs';
import { seedUsers, seedHospitals, seedEmergencies } from '../data/seedData.js';
import { triageRequest } from './ai/engines/rulesEngine.js';

let idCounter = 1000;
const nextId = () => `mock_${++idCounter}`;
const store = { users: [], hospitals: [], emergencies: [], notifications: [], donations: [] };

export function initMockStore() {
  store.users = seedUsers.map((u) => ({
    ...u,
    _id: nextId(),
    password: bcrypt.hashSync(u.password, 10),
    lastDonation: u.lastDonation ? new Date(u.lastDonation) : null,
    badges: [],
    createdAt: new Date(),
  }));
  store.hospitals = seedHospitals.map((h) => ({ ...h, _id: nextId(), createdAt: new Date() }));
  store.emergencies = seedEmergencies.map((e) => {
    const t = triageRequest(e);
    return {
      ...e, _id: nextId(),
      respondersCount: Math.floor(Math.random() * 5),
      matchedDonors: [],
      priorityScore: t.priorityScore, triageLabel: t.triageLabel, triageReasons: t.triageReasons,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      expiresAt: new Date(Date.now() + 6 * 3600000),
    };
  });

  // Seed a few donation records per donor, derived from their profile, so the
  // "My Donations" page shows realistic history even in mock mode.
  const HOSPITALS = ['AIIMS', 'Apollo Hospital', 'Fortis Hospital', 'Kokilaben Hospital', 'Manipal Hospital'];
  const TYPES = ['Whole Blood', 'Platelets', 'Plasma'];
  store.donations = [];
  store.users
    .filter((u) => u.role === 'donor')
    .forEach((u) => {
      const total = u.totalDonations || 3;
      const last = u.lastDonation ? new Date(u.lastDonation) : new Date();
      for (let i = 0; i < total; i++) {
        const d = new Date(last);
        d.setDate(d.getDate() - i * 92);
        store.donations.push({
          _id: nextId(),
          donor: u._id,
          hospital: `${HOSPITALS[i % HOSPITALS.length]}, ${u.city || 'Mumbai'}`,
          city: u.city || 'Mumbai',
          bloodType: u.bloodType || 'O+',
          units: 1,
          donationType: TYPES[i % TYPES.length],
          pointsAwarded: 50,
          date: d,
        });
      }

      // simple bookings
      store.bookings = [];
    });

  // Comm templates
  store.templates = [
    { _id: nextId(), name: 'Emergency SMS', channel: 'sms', subject: '', body: 'Hi {{name}}, {{units}} unit(s) of {{bloodType}} needed at {{hospital}}. Reply if you can help.', default: true, createdAt: new Date() },
    { _id: nextId(), name: 'Emergency Email', channel: 'email', subject: 'Urgent: {{units}} {{bloodType}} needed', body: 'Dear {{name}},\n\nWe urgently need {{units}} unit(s) of {{bloodType}} at {{hospital}}. Please respond if available.\n', default: true, createdAt: new Date() },
  ];
  store.audits = [];
}

export const mock = {
  findUserByEmail: (email) => store.users.find((u) => u.email === email.toLowerCase()),
  findUserByPhone: (phone) => store.users.find((u) => u.phone === phone),
  findUserById: (id) => store.users.find((u) => u._id === id),
  createUser: (data) => {
    const user = {
      ...data, _id: nextId(), email: data.email.toLowerCase(),
      password: bcrypt.hashSync(data.password, 10),
      donorStatus: 'active', available: true, totalDonations: 0,
      points: 0, tier: 'Bronze', badges: [], reliability: 80, verified: false,
      lastDonation: null, createdAt: new Date(),
    };
    store.users.push(user);
    return user;
  },
  listDonors: (filter = {}) =>
    store.users.filter((u) => {
      if (filter.bloodType && u.bloodType !== filter.bloodType) return false;
      if (filter.city && u.city !== filter.city) return false;
      if (filter.available !== undefined && u.available !== filter.available) return false;
      return true;
    }),
  updateUser: (id, patch) => {
    const u = store.users.find((x) => x._id === id);
    if (u) Object.assign(u, patch);
    return u;
  },
  listDonationsByDonor: (donorId) =>
    store.donations
      .filter((d) => d.donor === donorId)
      .sort((a, b) => b.date - a.date),
  listHospitals: (city) => (city ? store.hospitals.filter((h) => h.city === city) : store.hospitals),
  findHospitalById: (id) => store.hospitals.find((h) => h._id === id),
  listEmergencies: (filter = {}) => {
    let list = [...store.emergencies];
    if (filter.status) list = list.filter((e) => e.status === filter.status);
    if (filter.city) list = list.filter((e) => e.city === filter.city);
    return list.sort((a, b) => b.priorityScore - a.priorityScore || b.createdAt - a.createdAt);
  },
  createEmergency: (data) => {
    const e = {
      ...data, _id: nextId(), status: 'open', respondersCount: 0, matchedDonors: [],
      createdAt: new Date(), expiresAt: new Date(Date.now() + 6 * 3600000),
    };
    store.emergencies.unshift(e);
    return e;
  },
  findEmergencyById: (id) => store.emergencies.find((e) => e._id === id),
  updateEmergency: (id, patch) => {
    const e = store.emergencies.find((x) => x._id === id);
    if (e) Object.assign(e, patch);
    return e;
  },
  createBooking: (data) => {
    const b = { ...data, _id: nextId(), createdAt: new Date(), status: 'booked' };
    store.bookings.push(b);
    return b;
  },
  updateHospitalInventory: (hospitalId, inventory) => {
    const h = store.hospitals.find((x) => x._id === hospitalId);
    if (!h) return null;
    h.inventory = inventory;
    return h;
  },
  listBookingsForHospital: (hospitalId) => store.bookings.filter((b) => b.hospital === hospitalId).sort((a,b)=>a.slotAt-b.slotAt),
  listBookingsForDonor: (donorId) => store.bookings.filter((b) => b.donor === donorId).sort((a,b)=>b.slotAt-a.slotAt),
  updateBooking: (id, patch) => { const b = store.bookings.find((x)=>x._id===id); if (b) Object.assign(b, patch); return b; },
  listNotifications: (userId) => store.notifications.filter((n) => !userId || n.user === userId).slice(0, 20),
  createNotification: (userId, data) => {
    const n = { _id: nextId(), user: userId, ...data, read: false, createdAt: new Date() };
    store.notifications.unshift(n);
    return n;
  },
  updateNotificationRead: (id, read = true) => {
    const n = store.notifications.find((x) => x._id === id);
    if (n) { n.read = !!read; }
    return n;
  },
  listCommTemplates: (filter = {}) => {
    let out = store.templates.slice(0);
    if (filter.channel) out = out.filter((t) => t.channel === filter.channel);
    if (filter.name) out = out.filter((t) => new RegExp(filter.name, 'i').test(t.name));
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return out.slice(skip, skip + limit);
  },
  countCommTemplates: (filter = {}) => {
    let out = store.templates.slice(0);
    if (filter.channel) out = out.filter((t) => t.channel === filter.channel);
    if (filter.name) out = out.filter((t) => new RegExp(filter.name, 'i').test(t.name));
    return out.length;
  },
  findCommTemplateById: (id) => store.templates.find((t) => t._id === id),
  createCommTemplate: (data) => { const t = { _id: nextId(), ...data, createdAt: new Date() }; store.templates.unshift(t); return t; },
  updateCommTemplate: (id, patch) => { const t = store.templates.find((x) => x._id === id); if (t) Object.assign(t, patch); return t; },
  deleteCommTemplate: (id) => { const idx = store.templates.findIndex((x) => x._id === id); if (idx === -1) return false; store.templates.splice(idx, 1); return true; },
  createAuditLog: (payload) => { const a = { _id: nextId(), ...payload, createdAt: new Date() }; store.audits.unshift(a); return a; },
  listAuditLogs: (filter = {}) => {
    let out = store.audits.slice(0);
    if (filter.target) out = out.filter((a) => a.target === filter.target);
    if (filter.targetId) out = out.filter((a) => a.targetId === filter.targetId);
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return out.slice(skip, skip + limit);
  },
  listAdmins: () => store.users.filter((u) => ['admin', 'coordinator'].includes(u.role)),
  createCommJob: (payload) => { const j = { _id: nextId(), attempts: 0, maxAttempts: 5, status: 'pending', nextAttemptAt: new Date(), ...payload, createdAt: new Date() }; store.jobs = store.jobs || []; store.jobs.unshift(j); return j; },
  fetchPendingCommJobs: (limit = 20) => { store.jobs = store.jobs || []; const now = new Date(); return store.jobs.filter((j) => j.status === 'pending' && new Date(j.nextAttemptAt) <= now).slice(0, limit); },
  markCommJob: (id, patch) => { store.jobs = store.jobs || []; const j = store.jobs.find((x) => x._id === id); if (j) Object.assign(j, patch); return j; },
  listCommJobs: (filter = {}) => {
    store.jobs = store.jobs || [];
    let out = store.jobs.slice(0);
    if (filter.status) out = out.filter((j) => j.status === filter.status);
    const page = parseInt(filter.page || '1', 10) || 1;
    const limit = Math.min(parseInt(filter.limit || '20', 10) || 20, 200);
    const skip = (page - 1) * limit;
    return out.slice(skip, skip + limit);
  },
  stats: () => ({
    donors: store.users.filter((u) => u.role === 'donor').length,
    hospitals: store.hospitals.length,
    openEmergencies: store.emergencies.filter((e) => e.status === 'open').length,
    totalUnits: store.hospitals.reduce((sum, h) => sum + h.inventory.reduce((s, i) => s + i.units, 0), 0),
  }),
  _store: store,
};