import { asyncHandler } from '../middleware/error.js';
import { repo } from '../services/repository.js';
import commQueue from '../services/commQueue.js';

export const listJobs = asyncHandler(async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query || {};
  const filter = { status, page, limit };
  const [jobs, total] = await Promise.all([
    repo.listCommJobs(filter),
    repo.countCommJobs(filter),
  ]);
  res.json({ success: true, jobs, total });
});

export const retryJob = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const job = await repo.markCommJob(id, { status: 'pending', nextAttemptAt: new Date(), lastError: null });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  // trigger worker once
  try { await commQueue.workerOnce(1); } catch (e) {}
  res.json({ success: true, job });
});

export const createJob = asyncHandler(async (req, res) => {
  const { type, to, subject, body, vars } = req.body || {};
  if (!type || !to) return res.status(422).json({ success: false, message: 'Missing type or to' });
  const job = await repo.createCommJob({ type, to, subject, body, vars, attempts: 0, nextAttemptAt: new Date() });
  // trigger worker once to try deliver immediately
  try { await commQueue.workerOnce(1); } catch (e) {}
  res.status(201).json({ success: true, job });
});

export default { listJobs, retryJob, createJob };
