import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const missing: string[] = [];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    missing.push(name);
    return '';
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  databaseUrl: required('DATABASE_URL'),
  cloudinaryCloudName: required('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: required('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: required('CLOUDINARY_API_SECRET'),
  cloudinaryFolder: optional('CLOUDINARY_UPLOAD_FOLDER', 'wsa'),
  adminJwtSecret: required('ADMIN_JWT_SECRET'),
  // Optional: the public AI assistant / news endpoints return 503 when unset.
  openRouterApiKey: optional('OPENROUTER_API_KEY'),
  openRouterModel: optional('OPENROUTER_MODEL', 'openai/gpt-4o-mini'),
  newsApiKey: optional('NEWS_API_KEY'),
  siteUrl: optional('SITE_URL', isProduction ? 'https://wsfxacademy.com' : 'http://localhost:3000'),
  // Optional fallback for the Google reviews sync (the admin can also save a key in the dashboard).
  googlePlacesApiKey: optional('GOOGLE_PLACES_API_KEY'),
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" to /api/cron/* when this is set.
  cronSecret: optional('CRON_SECRET'),
  port: parseInt(process.env.PORT || '4000', 10),
  allowedOrigins: optional(
    'ALLOWED_ORIGINS',
    isProduction
      ? 'https://wsfxacademy.com,https://www.wsfxacademy.com,https://admin.wsfxacademy.com'
      : 'http://localhost:3000,http://localhost:3001',
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Names of any required vars that are not set. Empty => correctly configured.
  missing,
};

// Surface misconfiguration loudly in logs. We do NOT throw here: in a serverless
// environment throwing at import time produces an opaque FUNCTION_INVOCATION_FAILED
// crash. Instead the app serves a clear 503 (see app.ts) so the problem is visible.
if (missing.length > 0) {
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
}
