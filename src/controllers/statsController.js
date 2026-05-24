import { repo } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';

/** GET /api/stats — homepage headline numbers. */
export const getStats = asyncHandler(async (req, res) => {
  const base = await repo.stats();
  // Derived/marketing figures kept consistent with the live counts.
  res.json({
    success: true,
    stats: {
      registeredDonors: base.donors,
      bloodUnitsAvailable: base.totalUnits,
      hospitalsConnected: base.hospitals,
      openEmergencies: base.openEmergencies,
      livesSaved: base.donors * 3, // illustrative derived metric
    },
  });
});
