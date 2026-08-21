import { asyncHandler } from '../middleware/error.js';
import { repo } from '../services/repository.js';

/** GET /api/notifications — list for authenticated user */
export const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.user && (req.user._id || req.user.id);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const notes = await repo.listNotifications(userId);
  res.json({ success: true, count: notes.length, notifications: notes });
});

/** POST /api/notifications/:id/read — mark as read */
export const markRead = asyncHandler(async (req, res) => {
  const userId = req.user && (req.user._id || req.user.id);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const id = req.params.id;
  // Simple update: only allow owner to mark their notification
  const note = await repo.listNotifications(userId);
  const exists = note.find((n) => String(n._id || n.id) === String(id));
  if (!exists) return res.status(404).json({ success: false, message: 'Notification not found' });
  // update persistence directly
  await repo.updateNotificationRead(id, true);
  res.json({ success: true });
});
