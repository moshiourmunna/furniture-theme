import 'server-only';
import { prisma } from '@shekor/db';
import { clientIp } from './http';

export async function audit(req: Request, userId: number | null, action: string, entity: string, entityId?: string | number | null, summary?: string, meta?: object) {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId: entityId != null ? String(entityId) : null, summary: summary?.slice(0, 250), meta: meta as object | undefined, ip: clientIp(req) },
  });
}
