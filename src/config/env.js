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
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
};

export const isProd = env.NODE_ENV === 'production';
