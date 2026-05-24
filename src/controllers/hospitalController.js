import { repo } from '../services/repository.js';
import { asyncHandler } from '../middleware/error.js';

/** GET /api/hospitals — list partner hospitals (optionally by city). */
export const listHospitals = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const hospitals = await repo.listHospitals(city);
  res.json({ success: true, count: hospitals.length, hospitals });
});

/** GET /api/hospitals/:id */
export const getHospital = asyncHandler(async (req, res) => {
  const hospital = await repo.findHospitalById(req.params.id);
  if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
  res.json({ success: true, hospital });
});

/** GET /api/hospitals/inventory/aggregate — national stock per blood type. */
export const aggregateInventory = asyncHandler(async (req, res) => {
  const hospitals = await repo.listHospitals(req.query.city);
  const totals = {};
  hospitals.forEach((h) => {
    (h.inventory || []).forEach((i) => {
      totals[i.bloodType] = (totals[i.bloodType] || 0) + i.units;
    });
  });
  const inventory = Object.entries(totals).map(([bloodType, units]) => {
    const status = units < 100 ? 'critical' : units < 500 ? 'low' : 'available';
    return { bloodType, units, status };
  });
  res.json({ success: true, inventory });
});
