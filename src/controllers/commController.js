import { asyncHandler } from '../middleware/error.js';
import { sendSms, sendEmail } from '../services/comm.js';
import { protect } from '../middleware/auth.js';

export const testSend = asyncHandler(async (req, res) => {
  const { channel, to, subject, text } = req.body || {};
  if (!channel || !to) return res.status(400).json({ success: false, message: 'channel and to required' });

  let ok = false;
  if (channel === 'sms') {
    ok = await sendSms(to, text || 'Test message from RaktSetu');
  } else if (channel === 'email') {
    ok = await sendEmail(to, subject || 'RaktSetu test', text || 'Test email from RaktSetu');
  } else {
    return res.status(400).json({ success: false, message: 'unknown channel' });
  }

  return res.json({ success: Boolean(ok) });
});

export default { testSend };
