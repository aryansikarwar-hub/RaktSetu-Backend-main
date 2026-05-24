/**
 * Blood group domain logic — the medical source of truth used by the
 * compatibility checker, the donor-match engine, and inventory rules.
 *
 * Donor RBC compatibility (who a donor's RED CELLS can be given to):
 *   O-  is the universal red-cell donor (gives to everyone).
 *   AB+ is the universal recipient (can receive from everyone).
 */

export const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// donor type -> array of recipient types that can safely receive their red cells
export const CAN_DONATE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// recipient type -> array of donor types they can safely receive red cells from
export const CAN_RECEIVE_FROM = BLOOD_TYPES.reduce((acc, recipient) => {
  acc[recipient] = BLOOD_TYPES.filter((donor) => CAN_DONATE_TO[donor].includes(recipient));
  return acc;
}, {});

export function isCompatible(donorType, recipientType) {
  return Boolean(CAN_DONATE_TO[donorType]?.includes(recipientType));
}

export function donorsForRecipient(recipientType) {
  return CAN_RECEIVE_FROM[recipientType] || [];
}

export function isValidBloodType(type) {
  return BLOOD_TYPES.includes(type);
}

/** Minimum gap (days) before a donor is eligible again, per donation type. */
export const DONATION_INTERVAL_DAYS = {
  'Whole Blood': 90, // ~3 months (commonly 56 in some regions; India guidance ~3 months)
  Platelets: 14,
  Plasma: 14,
  'Double Red Cells': 112,
};

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

/**
 * Returns { eligible, daysRemaining } based on last donation + donation type.
 */
export function donationEligibility(lastDonation, donationType = 'Whole Blood') {
  const gap = DONATION_INTERVAL_DAYS[donationType] ?? 90;
  const since = daysSince(lastDonation);
  if (since === null) return { eligible: true, daysRemaining: 0 };
  const remaining = Math.max(0, gap - since);
  return { eligible: remaining === 0, daysRemaining: remaining };
}
