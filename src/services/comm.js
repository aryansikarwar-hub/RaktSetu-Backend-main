import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { repo } from './repository.js';

let twilioClient = null;
try {
  if (!env.USE_MOCK && env.ENABLE_SMS && env.TWILIO_SID && env.TWILIO_TOKEN) {
    // lazy import
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const Twilio = require('twilio');
    twilioClient = Twilio(env.TWILIO_SID, env.TWILIO_TOKEN);
    logger.info('Twilio client initialised');
  }
} catch (err) {
  logger.warn('Twilio init failed: ' + err.message);
}

let sendgrid = null;
try {
  if (!env.USE_MOCK && env.ENABLE_EMAIL && env.SENDGRID_API_KEY) {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(env.SENDGRID_API_KEY);
    logger.info('SendGrid initialised');
  }
} catch (err) {
  logger.warn('SendGrid init failed: ' + err.message);
}

export async function sendSms(to, message) {
  if (env.USE_MOCK) return false;
  if (!env.ENABLE_SMS || !twilioClient) return false;
  if (env.ENABLE_SEND_QUEUE) {
    // enqueue job
    await repo.createCommJob({ type: 'sms', to, body: message, attempts: 0, nextAttemptAt: new Date() });
    return { queued: true };
  }
  try {
    const res = await twilioClient.messages.create({ body: message, from: env.TWILIO_FROM, to });
    logger.info(`SMS sent to ${to}`);
    return res;
  } catch (err) {
    logger.error('sendSms error: ' + (err.message || err));
    return false;
  }
}

export async function sendWhatsApp(to, message) {
  if (env.USE_MOCK) return false;
  if (!env.ENABLE_SMS || !twilioClient) return false;
  if (env.ENABLE_SEND_QUEUE) {
    await repo.createCommJob({ type: 'whatsapp', to, body: message, attempts: 0, nextAttemptAt: new Date() });
    return { queued: true };
  }
  try {
    const from = env.TWILIO_WHATSAPP_FROM || env.TWILIO_FROM;
    // Twilio expects 'whatsapp:+12345' format
    const res = await twilioClient.messages.create({ body: message, from, to });
    logger.info(`WhatsApp sent to ${to}`);
    return res;
  } catch (err) {
    logger.error('sendWhatsApp error: ' + (err.message || err));
    return false;
  }
}

function renderTemplate(tpl, vars = {}) {
  if (!tpl) return '';
  return String(tpl).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendTemplatedSms(to, vars = {}, fallback) {
  try {
    const templates = await repo.listCommTemplates();
    let tpl = null;
    if (vars && vars.templateName) tpl = (templates || []).find((t) => t.channel === 'sms' && t.name === vars.templateName);
    tpl = tpl || (templates || []).find((t) => t.channel === 'sms' && t.default) || (templates || []).find((t) => t.channel === 'sms');
    const body = tpl ? renderTemplate(tpl.body, vars) : (fallback || '');
    return sendSms(to, body);
  } catch (err) {
    logger.error('sendTemplatedSms error: ' + (err.message || err));
    return sendSms(to, fallback || '');
  }
}

export async function sendTemplatedWhatsApp(to, vars = {}, fallback) {
  try {
    const templates = await repo.listCommTemplates();
    let tpl = null;
    if (vars && vars.templateName) tpl = (templates || []).find((t) => (t.channel === 'whatsapp' || t.channel === 'sms') && t.name === vars.templateName);
    tpl = tpl || (templates || []).find((t) => t.channel === 'whatsapp' && t.default) || (templates || []).find((t) => t.channel === 'whatsapp') || (templates || []).find((t) => t.channel === 'sms');
    const body = tpl ? renderTemplate(tpl.body, vars) : (fallback || '');
    return sendWhatsApp(to, body);
  } catch (err) {
    logger.error('sendTemplatedWhatsApp error: ' + (err.message || err));
    return sendWhatsApp(to, fallback || '');
  }
}

export async function sendTemplatedEmail(to, vars = {}, fallbackSubject, fallbackBody) {
  try {
    const templates = await repo.listCommTemplates();
    let tpl = null;
    if (vars && vars.templateName) tpl = (templates || []).find((t) => t.channel === 'email' && t.name === vars.templateName);
    tpl = tpl || (templates || []).find((t) => t.channel === 'email' && t.default) || (templates || []).find((t) => t.channel === 'email') || (templates || [])[0];
    const subject = tpl ? renderTemplate(tpl.subject || '', vars) : (fallbackSubject || '');
    const bodyText = tpl ? renderTemplate(tpl.body || '', vars) : (fallbackBody || '');
    // create a simple HTML version by escaping and preserving line breaks
    const bodyHtml = `<div style="font-family: Arial,Helvetica,sans-serif; line-height:1.4;">${escapeHtml(bodyText).replace(/\n/g, '<br/>')}</div>`;
    return sendEmail(to, subject, bodyText, bodyHtml);
  } catch (err) {
    logger.error('sendTemplatedEmail error: ' + (err.message || err));
    return sendEmail(to, fallbackSubject || '', fallbackBody || '');
  }
}

export async function sendEmail(to, subject, text, html) {
  if (env.USE_MOCK) return false;
  if (!env.ENABLE_EMAIL || !sendgrid) return false;
  if (env.ENABLE_SEND_QUEUE) {
    await repo.createCommJob({ type: 'email', to, subject, body: text, attempts: 0, nextAttemptAt: new Date() });
    return { queued: true };
  }
  try {
    const msg = { to, from: env.EMAIL_FROM || 'no-reply@raktsetu.org', subject, text };
    if (html) msg.html = html;
    await sendgrid.send(msg);
    logger.info(`Email sent to ${to}`);
    return true;
  } catch (err) {
    logger.error('sendEmail error: ' + (err.message || err));
    return false;
  }
}

export default { sendSms, sendEmail };
