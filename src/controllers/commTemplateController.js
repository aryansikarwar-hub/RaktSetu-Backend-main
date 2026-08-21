import { asyncHandler } from '../middleware/error.js';
import { repo } from '../services/repository.js';
import { sendNotificationToUser } from '../services/realtime.js';

async function notifyAdminsAbout(audit) {
  try {
    const admins = await repo.listAdmins();
    if (!admins || !admins.length) return;
    const title = `Template ${audit.action}`;
    const body = `${audit.action} ${audit.target} ${audit.targetId}`;
    for (const a of admins) {
      const userId = a._id || a; // mock may return full user object
      try {
        await repo.createNotification(userId, { title, body, meta: { auditId: audit._id, target: audit.target, targetId: audit.targetId } });
        // attempt realtime push, ignore failures
        try { await sendNotificationToUser(userId, { title, body, meta: { auditId: audit._id } }); } catch (e) {}
      } catch (e) {}
    }
  } catch (e) {}
}

export const listTemplates = asyncHandler(async (req, res) => {
  const { channel, name, page = '1', limit = '20' } = req.query || {};
  const filter = { channel, name, page, limit };
  const [templates, total] = await Promise.all([
    repo.listCommTemplates(filter),
    repo.countCommTemplates(filter),
  ]);
  res.json({ success: true, templates, total });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const t = await repo.findCommTemplateById(req.params.id);
  if (!t) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, template: t });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const { name, channel, subject, body, default: def } = req.body;
  if (!name || !channel || !body) return res.status(422).json({ success: false, message: 'Invalid payload' });
  const t = await repo.createCommTemplate({ name, channel, subject, body, default: Boolean(def) });
  // audit + notify admins
  try {
    const audit = await repo.createAuditLog({ actor: req.user && (req.user._id || req.user.id), action: 'create', target: 'CommTemplate', targetId: t._id, data: { name, channel } });
    notifyAdminsAbout(audit);
  } catch (e) {}
  res.status(201).json({ success: true, template: t });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const t = await repo.updateCommTemplate(req.params.id, req.body);
  if (!t) return res.status(404).json({ success: false, message: 'Template not found' });
  try {
    const audit = await repo.createAuditLog({ actor: req.user && (req.user._id || req.user.id), action: 'update', target: 'CommTemplate', targetId: t._id, data: req.body });
    notifyAdminsAbout(audit);
  } catch (e) {}
  res.json({ success: true, template: t });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const ok = await repo.deleteCommTemplate(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Template not found' });
  try {
    const audit = await repo.createAuditLog({ actor: req.user && (req.user._id || req.user.id), action: 'delete', target: 'CommTemplate', targetId: req.params.id });
    notifyAdminsAbout(audit);
  } catch (e) {}
  res.json({ success: true });
});

export const listAudits = asyncHandler(async (req, res) => {
  const { target, targetId, page = '1', limit = '20' } = req.query || {};
  const filter = { target, targetId, page, limit };
  const [audits, total] = await Promise.all([
    repo.listAuditLogs(filter),
    repo.countAuditLogs(filter),
  ]);
  res.json({ success: true, audits, total });
});

export default { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, listAudits };
