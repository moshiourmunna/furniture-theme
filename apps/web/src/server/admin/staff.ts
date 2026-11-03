import 'server-only';
import { z } from 'zod';
import { ALL_PERMISSIONS } from '@shekor/shared';

export const roleInput = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(255).optional(), permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).max(100) });
export const staffSelect = { id: true, name: true, email: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true, role: { select: { id: true, name: true } } } as const;
