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
    });
}

export const mock = {
  findUserByEmail: (email) => store.users.find((u) => u.email === email.toLowerCase()),
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
  listNotifications: (userId) => store.notifications.filter((n) => !userId || n.user === userId).slice(0, 20),
  stats: () => ({
    donors: store.users.filter((u) => u.role === 'donor').length,
    hospitals: store.hospitals.length,
    openEmergencies: store.emergencies.filter((e) => e.status === 'open').length,
    totalUnits: store.hospitals.reduce((sum, h) => sum + h.inventory.reduce((s, i) => s + i.units, 0), 0),
  }),
  _store: store,
};