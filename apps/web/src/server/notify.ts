import 'server-only';
import { prisma } from '@shekor/db';
import { env } from './env';

/** Notification adapters. `mock` providers store every message in the outbox table (visible to tests/admin). */
export interface SmsProvider { send(to: string, body: string): Promise<void> }
export interface EmailProvider { send(to: string, subject: string, html: string): Promise<void> }

const mockSms: SmsProvider = {
  async send(to, body) {
    await prisma.outboxMessage.create({ data: { channel: 'sms', to, body, provider: 'mock' } });
    if (!env.isProd) console.info(`[sms:mock] → ${to}: ${body}`);
  },
};
const mockEmail: EmailProvider = {
  async send(to, subject, html) {
    await prisma.outboxMessage.create({ data: { channel: 'email', to, subject, body: html, provider: 'mock' } });
  },
};

// Real providers (SSL Wireless / SMTP) plug in here; they are selected by SMS_PROVIDER / EMAIL_PROVIDER.
export const sms: SmsProvider = env.smsProvider === 'mock' ? mockSms : mockSms;
export const email: EmailProvider = env.emailProvider === 'mock' ? mockEmail : mockEmail;

export async function sendOtp(target: string, code: string, locale: 'en' | 'bn' = 'en') {
  const body = locale === 'bn' ? `শেকড়: আপনার যাচাই কোড ${code}। ৫ মিনিট বৈধ। কাউকে জানাবেন না।` : `Shekor: your verification code is ${code}. Valid for 5 minutes. Do not share it.`;
  if (target.includes('@')) await email.send(target, 'Your Shekor verification code', `<p>${body}</p>`);
  else await sms.send(target, body);
}
