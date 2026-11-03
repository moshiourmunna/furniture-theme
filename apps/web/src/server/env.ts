import 'server-only';

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  adminOrigins: (process.env.ADMIN_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  sessionSecret: process.env.SESSION_SECRET || (isProd ? '' : 'dev-insecure-secret-change-me-0123456789'),
  revalidateSecret: process.env.REVALIDATE_SECRET || '',
  paymentMode: (process.env.PAYMENT_MODE || 'mock') as 'mock' | 'sandbox' | 'live',
  smsProvider: process.env.SMS_PROVIDER || 'mock',
  emailProvider: process.env.EMAIL_PROVIDER || 'mock',
  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
  storageLocalDir: process.env.STORAGE_LOCAL_DIR || './storage/uploads',
  /** Exposes OTP codes in API responses ONLY for mock SMS in non-production (dev + automated tests). */
  // Dev/test only: echo OTPs in API responses when SMS is mocked. Prod builds need EXPOSE_DEV_OTP=1 explicitly (E2E/CI).
  exposeDevOtp: (!isProd || process.env.EXPOSE_DEV_OTP === '1') && (process.env.SMS_PROVIDER || 'mock') === 'mock',
};

if (isProd && env.sessionSecret.length < 32) {
  // Fail fast rather than run production with a weak secret.
  throw new Error('SESSION_SECRET must be set (32+ chars) in production');
}
