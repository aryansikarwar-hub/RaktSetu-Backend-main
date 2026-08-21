import dotenv from 'dotenv';
dotenv.config();

const bool = (v, fallback = false) =>
  v === undefined ? fallback : ['true', '1', 'yes', 'on'].includes(String(v).toLowerCase());

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:4028',

  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/raktsetu',
  USE_MOCK: bool(process.env.USE_MOCK, true),

  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  AI_MODE: (process.env.AI_MODE || 'rules').toLowerCase(),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  // Communications
  ENABLE_SMS: bool(process.env.ENABLE_SMS, false),
  TWILIO_SID: process.env.TWILIO_SID || '',
  TWILIO_TOKEN: process.env.TWILIO_TOKEN || '',
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM || '',
  TWILIO_FROM: process.env.TWILIO_FROM || '',
  ENABLE_EMAIL: bool(process.env.ENABLE_EMAIL, false),
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
  ENABLE_SEND_QUEUE: bool(process.env.ENABLE_SEND_QUEUE, false),
  // Redis for OTP and other ephemeral stores
  USE_REDIS_OTP: bool(process.env.USE_REDIS_OTP, false),
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

export const isProd = env.NODE_ENV === 'production';