import { z } from 'zod';

import { BD_PHONE_RE, normalizePhone } from './bd';
import { PAYMENT_METHODS } from './commerce';

// Never probe for eval (`new Function`): the storefront CSP forbids it and browsers log the blocked probe as an error.
z.config({ jitless: true });

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => BD_PHONE_RE.test(v), { message: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)' });
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: 'Enter a valid email' }));
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72)
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/\d/, 'Include a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  phone: phoneSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().optional().default(false),
});
export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(191), // email or phone
  password: z.string().min(1).max(72),
});
export const otpRequestSchema = z.object({
  target: z.string().trim().min(3).max(191),
  purpose: z.enum(['login', 'verify', 'reset']),
});
export const otpVerifySchema = z.object({
  target: z.string().trim().min(3).max(191),
  purpose: z.enum(['login', 'verify', 'reset']),
  code: z.string().trim().regex(/^\d{6}$/, '6-digit code'),
});
export const resetPasswordSchema = z.object({
  target: z.string().trim().min(3).max(191),
  code: z.string().trim().regex(/^\d{6}$/),
  password: passwordSchema,
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).default('Home'),
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  division: z.string().trim().min(2).max(40),
  district: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(4).max(255),
  isDefault: z.boolean().optional().default(false),
});

export const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
  qty: z.number().int().min(1).max(20),
});

export const quoteRequestSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(50),
  couponCode: z.string().trim().max(40).optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  assembly: z.boolean().optional().default(true),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('bkash'),
  paymentPlan: z.enum(['full', 'advance']).optional().default('full'),
  advancePercent: z.number().int().min(20).max(50).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(50),
  customer: z.object({ name: z.string().trim().min(2).max(120), phone: phoneSchema, email: emailSchema.optional().or(z.literal('').transform(() => undefined)) }),
  address: z.object({
    division: z.string().trim().min(2).max(40),
    district: z.string().trim().min(2).max(60),
    area: z.string().trim().min(2).max(120),
    line1: z.string().trim().min(4).max(255),
  }),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliverySlot: z.enum(['morning', 'afternoon', 'evening']),
  assembly: z.boolean().default(true),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paymentPlan: z.enum(['full', 'advance']).default('full'),
  advancePercent: z.number().int().min(20).max(50).optional(),
  couponCode: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
  saveAddress: z.boolean().optional(),
  locale: z.enum(['en', 'bn']).default('en'),
  acceptTerms: z.literal(true, { message: 'Please accept the terms' }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(191),
  body: z.string().trim().min(10).max(4000),
  location: z.string().trim().max(120).optional(),
  photos: z.array(z.string().max(255)).max(4).optional(),
});

export const stockAlertSchema = z.object({ contact: z.string().trim().min(5).max(191) });
export const newsletterSchema = z.object({ email: emailSchema, locale: z.enum(['en', 'bn']).optional() });
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  phone: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  subject: z.string().trim().min(2).max(191),
  message: z.string().trim().min(10).max(4000),
});
export const customOrderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  city: z.string().trim().max(60).optional(),
  pieceType: z.string().trim().min(2).max(80),
  material: z.string().trim().max(60).optional(),
  dimensions: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(60).optional(),
  details: z.string().trim().min(10).max(4000),
});
export const consultationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  mode: z.enum(['showroom', 'video', 'home']),
  showroomId: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().trim().min(2).max(20),
  rooms: z.string().trim().max(191).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export const tradeInquirySchema = z.object({
  company: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
  sector: z.enum(['corporate', 'hospitality', 'residential-dev', 'architect', 'retail']),
  projectSize: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10).max(4000),
});
export const catalogueRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  address: z.string().trim().min(6).max(320),
  catalogues: z.array(z.string().max(80)).max(25).optional(),
});
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  locale: z.enum(['en', 'bn']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  marketingOptIn: z.boolean().optional(),
});
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });
