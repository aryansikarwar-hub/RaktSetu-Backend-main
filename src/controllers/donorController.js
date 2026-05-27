import { repo, safeUser } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';
import { donationEligibility, donorsForRecipient, CAN_DONATE_TO } from '../utils/bloodLogic.js';
import { haversineKm, cityCoords } from '../utils/geo.js';

/** GET /api/donors — search/filter donors (optionally near a city). */
export const searchDonors = asyncHandler(async (req, res) => {
  const { bloodType, city, available, compatibleWith } = req.query;

  const filter = {};
  if (bloodType) filter.bloodType = bloodType;
  if (city) filter.city = city;
  if (available !== undefined) filter.available = available === 'true';

  let donors = await repo.listDonors(filter);

  // If caller wants donors who can give to a recipient type, expand by compatibility.
  if (compatibleWith) {
    const validDonorTypes = donorsForRecipient(compatibleWith);
    donors = donors.filter((d) => validDonorTypes.includes(d.bloodType));
  }

  const refCoords = city ? cityCoords(city) : null;
  const result = donors.map((d) => {
    const elig = donationEligibility(d.lastDonation);
    const dCoords = (d.location && d.location.coordinates) || cityCoords(d.city);
    const distanceKm = refCoords && dCoords && dCoords[0] !== 0 ? haversineKm(refCoords, dCoords) : null;
    return {
      ...safeUser(d),
      eligible: elig.eligible,
      eligibleInDays: elig.daysRemaining,
      distanceKm,
    };
  });

  res.json({ success: true, count: result.length, donors: result });
});

/** GET /api/donors/eligibility — eligibility for the logged-in donor. */
export const myEligibility = asyncHandler(async (req, res) => {
  const user = await repo.findUserById(req.user._id || req.user.id);
  const elig = donationEligibility(user.lastDonation);
  res.json({ success: true, ...elig, lastDonation: user.lastDonation });
});

/** GET /api/donors/me/donations — donation history for the logged-in donor. */
export const myDonations = asyncHandler(async (req, res) => {
  const donorId = req.user._id || req.user.id;
  const docs = await repo.listDonationsByDonor(donorId);

  const donations = docs.map((d) => ({
    id: String(d._id),
    date: d.date,
    hospital: d.hospital || '—',
    city: d.city || '—',
    bloodType: d.bloodType,
    units: d.units ?? 1,
    donationType: d.donationType || 'Whole Blood',
    pointsAwarded: d.pointsAwarded ?? 0,
  }));

  res.json({ success: true, count: donations.length, donations });
});

/** PATCH /api/donors/me — update availability / profile basics. */
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['available', 'city', 'phone', 'donorStatus'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  if (patch.city) {
    const c = cityCoords(patch.city);
    if (c) patch.location = { type: 'Point', coordinates: c };
  }
  const updated = await repo.updateUser(req.user._id || req.user.id, patch);
  res.json({ success: true, user: safeUser(updated) });
});

/** GET /api/donors/compatibility/:type — who a type can give to / receive from. */
export const compatibility = asyncHandler(async (req, res) => {
  const type = req.params.type.toUpperCase();
  if (!CAN_DONATE_TO[type]) return res.status(400).json({ success: false, message: 'Invalid blood type' });
  res.json({
    success: true,
    bloodType: type,
    canDonateTo: CAN_DONATE_TO[type],
    canReceiveFrom: donorsForRecipient(type),
  });
});