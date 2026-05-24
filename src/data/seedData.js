/** Realistic seed data for India. Used by both the seed script and mock store. */
import { cityCoords } from '../utils/geo.js';

const coord = (city) => ({ type: 'Point', coordinates: cityCoords(city) || [0, 0] });

export const seedUsers = [
  { name: 'Arjun Sharma', email: 'arjun@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'O+', city: 'Mumbai', phone: '+91 98765 43210', donorStatus: 'active', available: true, lastDonation: '2026-02-14', totalDonations: 7, points: 700, tier: 'Gold', reliability: 92, verified: true, location: coord('Mumbai') },
  { name: 'Dr. Priya Menon', email: 'admin@raktsetu.in', password: 'password123', role: 'admin', bloodType: 'A+', city: 'Bangalore', phone: '+91 99887 65432', donorStatus: 'active', available: true, lastDonation: '2026-01-20', totalDonations: 4, points: 400, tier: 'Silver', reliability: 88, verified: true, location: coord('Bangalore') },
  { name: 'Rahul Verma', email: 'rahul@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'O-', city: 'Delhi', phone: '+91 98111 22334', donorStatus: 'active', available: true, lastDonation: '2025-11-02', totalDonations: 12, points: 1240, tier: 'Platinum', reliability: 97, verified: true, location: coord('Delhi') },
  { name: 'Sneha Iyer', email: 'sneha@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'B+', city: 'Mumbai', phone: '+91 90000 11223', donorStatus: 'active', available: true, lastDonation: '2026-03-01', totalDonations: 3, points: 300, tier: 'Silver', reliability: 80, verified: true, location: coord('Mumbai') },
  { name: 'Vikram Singh', email: 'vikram@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'A-', city: 'Delhi', phone: '+91 90111 44556', donorStatus: 'active', available: true, lastDonation: null, totalDonations: 0, points: 0, tier: 'Bronze', reliability: 75, verified: false, location: coord('Delhi') },
  { name: 'Ananya Reddy', email: 'ananya@raktsetu.in', password: 'password123', role: 'coordinator', bloodType: 'AB+', city: 'Hyderabad', phone: '+91 91234 55667', donorStatus: 'active', available: true, lastDonation: '2025-12-15', totalDonations: 6, points: 620, tier: 'Gold', reliability: 90, verified: true, location: coord('Hyderabad') },
  { name: 'Karthik Nair', email: 'karthik@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'O+', city: 'Chennai', phone: '+91 93456 77889', donorStatus: 'active', available: true, lastDonation: '2026-04-10', totalDonations: 5, points: 510, tier: 'Gold', reliability: 85, verified: true, location: coord('Chennai') },
  { name: 'Meera Joshi', email: 'meera@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'B-', city: 'Pune', phone: '+91 94567 88990', donorStatus: 'active', available: false, lastDonation: '2026-05-01', totalDonations: 2, points: 200, tier: 'Bronze', reliability: 70, verified: true, location: coord('Pune') },
  { name: 'Aditya Kumar', email: 'aditya@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'AB-', city: 'Indore', phone: '+91 95678 99001', donorStatus: 'active', available: true, lastDonation: '2025-10-20', totalDonations: 9, points: 940, tier: 'Platinum', reliability: 95, verified: true, location: coord('Indore') },
  { name: 'Pooja Desai', email: 'pooja@raktsetu.in', password: 'password123', role: 'donor', bloodType: 'O-', city: 'Mumbai', phone: '+91 96789 00112', donorStatus: 'active', available: true, lastDonation: '2026-01-05', totalDonations: 8, points: 820, tier: 'Gold', reliability: 91, verified: true, location: coord('Mumbai') },
];

export const seedHospitals = [
  { name: 'AIIMS New Delhi', city: 'New Delhi', address: 'Ansari Nagar East, New Delhi', phone: '011-2658-8500', beds: 2478, hasBloodBank: true, verified: true, location: coord('New Delhi'),
    inventory: [{ bloodType: 'O+', units: 203 }, { bloodType: 'O-', units: 34 }, { bloodType: 'A+', units: 124 }, { bloodType: 'A-', units: 12 }, { bloodType: 'B+', units: 89 }, { bloodType: 'B-', units: 8 }, { bloodType: 'AB+', units: 56 }, { bloodType: 'AB-', units: 6 }] },
  { name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', address: 'Four Bunglows, Andheri West, Mumbai', phone: '022-3066-1234', beds: 750, hasBloodBank: true, verified: true, location: coord('Mumbai'),
    inventory: [{ bloodType: 'O+', units: 156 }, { bloodType: 'O-', units: 22 }, { bloodType: 'A+', units: 98 }, { bloodType: 'B+', units: 110 }, { bloodType: 'B-', units: 4 }, { bloodType: 'AB+', units: 40 }] },
  { name: 'Manipal Hospital', city: 'Bangalore', address: 'HAL Airport Road, Bangalore', phone: '080-2502-4444', beds: 600, hasBloodBank: true, verified: true, location: coord('Bangalore'),
    inventory: [{ bloodType: 'O+', units: 134 }, { bloodType: 'O-', units: 18 }, { bloodType: 'A+', units: 76 }, { bloodType: 'A-', units: 5 }, { bloodType: 'B+', units: 92 }, { bloodType: 'AB+', units: 33 }] },
  { name: 'Apollo Hospitals', city: 'Chennai', address: 'Greams Road, Chennai', phone: '044-2829-3333', beds: 560, hasBloodBank: true, verified: true, location: coord('Chennai'),
    inventory: [{ bloodType: 'O+', units: 142 }, { bloodType: 'A+', units: 88 }, { bloodType: 'A-', units: 14 }, { bloodType: 'B+', units: 70 }, { bloodType: 'AB+', units: 28 }, { bloodType: 'AB-', units: 9 }] },
  { name: 'Ruby Hall Clinic', city: 'Pune', address: 'Sassoon Road, Pune', phone: '020-6645-5100', beds: 750, hasBloodBank: true, verified: true, location: coord('Pune'),
    inventory: [{ bloodType: 'O+', units: 96 }, { bloodType: 'O-', units: 11 }, { bloodType: 'B+', units: 64 }, { bloodType: 'B-', units: 6 }, { bloodType: 'A+', units: 52 }] },
  { name: 'Bombay Hospital', city: 'Indore', address: 'Ring Road, Indore', phone: '0731-255-8866', beds: 700, hasBloodBank: true, verified: true, location: coord('Indore'),
    inventory: [{ bloodType: 'O+', units: 78 }, { bloodType: 'A+', units: 44 }, { bloodType: 'B+', units: 58 }, { bloodType: 'AB+', units: 19 }, { bloodType: 'AB-', units: 3 }] },
];

export const seedEmergencies = [
  { bloodType: 'O-', units: 4, urgency: 'critical', hospital: 'AIIMS New Delhi', city: 'Delhi', ward: 'Trauma ICU', contactName: 'Dr. S. Rao', contactPhone: '+91 98100 00001', patientAge: 34, patientGender: 'Male', reason: 'Road accident trauma surgery, severe blood loss, immediate transfusion required.', status: 'open' },
  { bloodType: 'B-', units: 2, urgency: 'urgent', hospital: 'Kokilaben Hospital', city: 'Mumbai', ward: 'Maternity', contactName: 'Nurse Latha', contactPhone: '+91 98200 00002', patientAge: 28, patientGender: 'Female', reason: 'Post-partum hemorrhage, mother stable but requires backup units.', status: 'open' },
  { bloodType: 'AB-', units: 1, urgency: 'moderate', hospital: 'Manipal Hospital', city: 'Bangalore', ward: 'Oncology', contactName: 'Dr. Pillai', contactPhone: '+91 98300 00003', patientAge: 61, patientGender: 'Male', reason: 'Chemotherapy support transfusion scheduled for tomorrow morning.', status: 'open' },
];
