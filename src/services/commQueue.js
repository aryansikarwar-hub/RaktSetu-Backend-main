import { repo } from './repository.js';
import { sendSms, sendEmail, sendWhatsApp } from './comm.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let running = false;

function backoffMs(attempts) {
  // exponential backoff with jitter
  const base = Math.min(60 * 60 * 1000, Math.pow(2, attempts) * 1000);
  return base + Math.floor(Math.random() * 1000);
}

export async function processJob(job) {
  try {
    // mark sending
    await repo.markCommJob(job._id, { status: 'sending', attempts: job.attempts + 1 });
    let ok = false;
    if (job.type === 'sms') ok = await sendSms(job.to, job.body || '');
    else if (job.type === 'whatsapp') ok = await sendWhatsApp(job.to, job.body || '');
    else if (job.type === 'email') ok = await sendEmail(job.to, job.subject || '', job.body || '', job.html || '');

    if (ok) {
      await repo.markCommJob(job._id, { status: 'success', lastError: null });
      logger.info(`Comm job ${job._id} succeeded`);
    } else {
      const attempts = (job.attempts || 0) + 1;
      if (attempts >= (job.maxAttempts || 5)) {
        await repo.markCommJob(job._id, { status: 'failed', attempts, lastError: 'max attempts reached' });
        logger.warn(`Comm job ${job._id} failed (max attempts)`);
      } else {
        const next = new Date(Date.now() + backoffMs(attempts));
        await repo.markCommJob(job._id, { status: 'pending', attempts, nextAttemptAt: next, lastError: 'retry scheduled' });
        logger.info(`Comm job ${job._id} scheduled retry at ${next.toISOString()}`);
      }
    }
  } catch (err) {
    const attempts = (job.attempts || 0) + 1;
    if (attempts >= (job.maxAttempts || 5)) {
      await repo.markCommJob(job._id, { status: 'failed', attempts, lastError: String(err.message || err) });
      logger.warn(`Comm job ${job._id} failed with error: ${err.message}`);
    } else {
      const next = new Date(Date.now() + backoffMs(attempts));
      await repo.markCommJob(job._id, { status: 'pending', attempts, nextAttemptAt: next, lastError: String(err.message || err) });
      logger.info(`Comm job ${job._id} errored, retrying at ${next.toISOString()}`);
    }
  }
}

export async function workerOnce(limit = 10) {
  const jobs = await repo.fetchPendingCommJobs(limit);
  if (!jobs || !jobs.length) return 0;
  for (const j of jobs) {
    // hydrate defaults
    await processJob(j);
  }
  return jobs.length;
}

export function startWorker(intervalMs = 5000) {
  if (running) return;
  if (!env.ENABLE_SEND_QUEUE) return;
  running = true;
  logger.info('CommQueue worker starting');
  const loop = async () => {
    try {
      await workerOnce(20);
    } catch (e) {
      logger.error('CommQueue worker error: ' + e.message);
    }
  };
  // run immediately then schedule
  loop();
  const id = setInterval(loop, intervalMs);
  return () => { clearInterval(id); running = false; };
}

export default { startWorker, workerOnce, processJob };
