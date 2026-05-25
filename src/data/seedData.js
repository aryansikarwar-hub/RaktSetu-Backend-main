/**
 * SEED DATA — realistic, bulk demo data for RaktSetu.
 * Generated programmatically so you get LOTS of natural-looking records:
 *   - donors, hospital-staff, admins (all can log in)
 *   - hospitals with blood inventory
 *   - active emergencies
 *
 * Tune the counts in CONFIG below. Run `npm run seed` (needs USE_MOCK=false
 * and a valid MONGO_URI) to insert everything into MongoDB.
 *
 * Every generated account uses the password: password123
 */
import { BLOOD_TYPES } from '../utils/bloodLogic.js';

// ── How much data to generate ─────────────────────────────────────────────
const CONFIG = {
  donors: 200,       // blood donors (user accounts)
  hospitals: 200,    // hospitals (each gets one hospital-role login)
  admins: 5,         // network admins — kept small because real networks have few
  emergencies: 40,   // active emergency requests
};

// ── Real Indian cities with [lng, lat] coordinates ────────────────────────
const CITIES = [
  { city: 'Mumbai',     coords: [72.8777, 19.0760] },
  { city: 'Delhi',      coords: [77.1025, 28.7041] },
  { city: 'Bengaluru',  coords: [77.5946, 12.9716] },
  { city: 'Hyderabad',  coords: [78.4867, 17.3850] },
  { city: 'Chennai',    coords: [80.2707, 13.0827] },
  { city: 'Kolkata',    coords: [88.3639, 22.5726] },
  { city: 'Pune',       coords: [73.8567, 18.5204] },
  { city: 'Ahmedabad',  coords: [72.5714, 23.0225] },
  { city: 'Jaipur',     coords: [75.7873, 26.9124] },
  { city: 'Indore',     coords: [75.8577, 22.7196] },
  { city: 'Lucknow',    coords: [80.9462, 26.8467] },
  { city: 'Bhopal',     coords: [77.4126, 23.2599] },
];

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya', 'Karan', 'Pooja',
  'Aditya', 'Riya', 'Sahil', 'Neha', 'Rahul', 'Divya', 'Amit', 'Kavya',
  'Siddharth', 'Meera', 'Varun', 'Isha', 'Nikhil', 'Tanvi', 'Aryan', 'Shreya',
  'Manish', 'Aishwarya', 'Raj', 'Sanya', 'Dev', 'Nisha', 'Harsh', 'Pallavi',
  'Yash', 'Simran', 'Akash', 'Ritika', 'Gaurav', 'Anjali', 'Kunal', 'Swati',
  'Abhishek', 'Deepika', 'Sanjay', 'Komal', 'Vivek', 'Preeti', 'Naveen', 'Sunita',
  'Rakesh', 'Geeta', 'Sandeep', 'Madhuri', 'Ashish', 'Rekha', 'Tarun', 'Bhavna',
  'Imran', 'Fatima', 'Suresh', 'Lakshmi', 'Manoj', 'Simi', 'Ravi', 'Jyoti',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Mehta', 'Singh',
  'Iyer', 'Joshi', 'Kapoor', 'Rao', 'Desai', 'Chopra', 'Malhotra', 'Bose',
  'Pillai', 'Agarwal', 'Bhatt', 'Menon', 'Saxena', 'Chauhan', 'Nadar', 'Banerjee',
  'Khan', 'Das', 'Mukherjee', 'Naidu', 'Trivedi', 'Shetty', 'Kulkarni', 'Pandey',
  'Mishra', 'Sinha', 'Ghosh', 'Bhatia', 'Chakraborty', 'Yadav', 'Jain', 'Dube',
];

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

// Deterministic-ish PRNG helpers (so reruns vary a bit but stay realistic)
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const phone = () => `+91 ${90 + rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)} ${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}`;
// jitter coordinates slightly so donors aren't all on one pixel
const jitter = ([lng, lat]) => [lng + (Math.random() - 0.5) * 0.15, lat + (Math.random() - 0.5) * 0.15];

function daysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10);
}

// ── DONORS ────────────────────────────────────────────────────────────────
function buildDonors() {
  const out = [];
  for (let i = 0; i < CONFIG.donors; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const loc = pick(CITIES);
    const total = rand(15);
    const tier = total >= 10 ? 'Platinum' : total >= 5 ? 'Gold' : total >= 2 ? 'Silver' : 'Bronze';
    const lastDon = total > 0 ? daysAgo(rand(180)) : null;
    out.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@raktsetu.in`,
      password: 'password123',
      role: 'donor',
      bloodType: pick(BLOOD_TYPES),
      city: loc.city,
      phone: phone(),
      donorStatus: Math.random() > 0.2 ? 'active' : 'inactive',
      available: Math.random() > 0.25,
      lastDonation: lastDon,
      totalDonations: total,
      points: total * 100,
      tier,
      reliability: 70 + rand(30),
      verified: Math.random() > 0.15,
      location: { type: 'Point', coordinates: jitter(loc.coords) },
    });
  }
  return out;
}

// ── HOSPITALS + matching hospital-staff logins ───────────────────────────
// Build many realistic, unique hospital names by combining real chains/brands
// with city localities, so 200 hospitals all look genuine.
const HOSPITAL_BRANDS = [
  'Apollo Hospital', 'Fortis Healthcare', 'Kokilaben Dhirubhai Ambani Hospital',
  'Lilavati Hospital', 'AIIMS', 'Manipal Hospital', 'Max Super Speciality Hospital',
  'Narayana Health', 'Medanta', 'Ruby Hall Clinic', 'CARE Hospital', 'Columbia Asia',
  'Wockhardt Hospital', 'Jaslok Hospital', 'Hinduja Hospital', 'Sir Ganga Ram Hospital',
  'BLK-Max Hospital', 'Sterling Hospital', 'KIMS Hospital', 'Rainbow Children Hospital',
  'Global Hospital', 'Yashoda Hospital', 'Care Wellness Centre', 'Sunshine Hospital',
];
const LOCALITIES = [
  'Andheri', 'Bandra', 'Powai', 'Whitefield', 'Koramangala', 'Banjara Hills',
  'Salt Lake', 'Anna Nagar', 'Vasant Kunj', 'Hadapsar', 'Satellite', 'Malviya Nagar',
  'Gomti Nagar', 'Arera Colony', 'Vijay Nagar', 'Jubilee Hills', 'Velachery',
  'Rajouri Garden', 'Kalyani Nagar', 'Navrangpura',
];

function buildHospitals() {
  const out = [];
  const used = new Set();
  for (let i = 0; i < CONFIG.hospitals; i++) {
    const loc = pick(CITIES);
    const brand = pick(HOSPITAL_BRANDS);
    const area = pick(LOCALITIES);
    let name = `${brand}, ${area}, ${loc.city}`;
    // ensure uniqueness
    if (used.has(name)) name = `${brand}, ${area}, ${loc.city} #${i}`;
    used.add(name);
    const inventory = BLOOD_TYPES.map((bt) => ({ bloodType: bt, units: 5 + rand(120) }));
    out.push({
      name,
      city: loc.city,
      address: `${100 + rand(900)} ${area} Road, ${loc.city}`,
      phone: phone(),
      beds: 80 + rand(900),
      hasBloodBank: Math.random() > 0.1,
      verified: Math.random() > 0.1,
      location: { type: 'Point', coordinates: jitter(loc.coords) },
      inventory,
    });
  }
  return out;
}

// One hospital-staff login per hospital (so each hospital has an account).
function buildHospitalStaff(hospitals) {
  const out = [];
  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    out.push({
      name: `Dr. ${first} ${last}`,
      email: `hospital${i}@raktsetu.in`,
      password: 'password123',
      role: 'hospital',
      city: h.city,
      phone: phone(),
      hospitalName: h.name,
      licenseNumber: `BLB-${h.city.slice(0, 3).toUpperCase()}-${1000 + i}`,
      designation: pick(['Blood Bank Officer', 'Transfusion Lead', 'Lab Coordinator', 'Medical Superintendent']),
      verified: true,
      location: { type: 'Point', coordinates: h.location.coordinates },
    });
  }
  return out;
}

// ── ADMINS ────────────────────────────────────────────────────────────────
function buildAdmins() {
  const out = [];
  for (let i = 0; i < CONFIG.admins; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    out.push({
      name: `${first} ${last}`,
      email: `admin${i}@raktsetu.in`,
      password: 'password123',
      role: 'admin',
      city: pick(CITIES).city,
      phone: phone(),
      verified: true,
    });
  }
  return out;
}

// ── EMERGENCIES ────────────────────────────────────────────────────────────
function buildEmergencies() {
  const out = [];
  const urgencies = ['critical', 'urgent', 'moderate'];
  const reasons = [
    'Post-accident trauma, urgent surgery',
    'Major surgery scheduled, blood reserve needed',
    'Severe anaemia, transfusion required',
    'Childbirth complication',
    'Dengue with low platelets',
    'Cancer patient, ongoing therapy',
  ];
  for (let i = 0; i < CONFIG.emergencies; i++) {
    const loc = pick(CITIES);
    const hname = pick(HOSPITAL_BRANDS);
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    out.push({
      bloodType: pick(BLOOD_TYPES),
      units: 1 + rand(8),
      urgency: pick(urgencies),
      hospital: `${hname}, ${loc.city}`,
      city: loc.city,
      ward: pick(['ICU', 'Emergency', 'Surgery', 'Trauma', 'Maternity']),
      contactName: `Dr. ${first} ${last}`,
      contactPhone: phone(),
      patientAge: 5 + rand(80),
      patientGender: pick(['Male', 'Female']),
      reason: pick(reasons),
      status: 'open',
      respondersCount: rand(6),
    });
  }
  return out;
}

// Generate hospitals first, so each hospital-staff login maps to a real hospital.
export const seedHospitals = buildHospitals();

// A few guaranteed easy-to-remember login accounts at the front of each list,
// then the bulk generated data after them.
export const seedUsers = [
  {
    name: 'Arjun Sharma', email: 'arjun@raktsetu.in', password: 'password123',
    role: 'donor', bloodType: 'O+', city: 'Mumbai', phone: '+91 98765 43210',
    donorStatus: 'active', available: true, lastDonation: '2026-02-14',
    totalDonations: 7, points: 700, tier: 'Gold', reliability: 92, verified: true,
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
  },
  {
    name: 'Dr. Meera Iyer', email: 'hospital@raktsetu.in', password: 'password123',
    role: 'hospital', city: 'Mumbai', phone: '+91 98200 11122',
    hospitalName: 'Apollo Hospital, Andheri, Mumbai', licenseNumber: 'BLB-MUM-0001',
    designation: 'Blood Bank Officer', verified: true,
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
  },
  {
    name: 'Rajesh Khanna', email: 'admin@raktsetu.in', password: 'password123',
    role: 'admin', city: 'Delhi', phone: '+91 99100 33344', verified: true,
  },
  ...buildDonors(),
  ...buildHospitalStaff(seedHospitals),
  ...buildAdmins(),
];

export const seedEmergencies = buildEmergencies();