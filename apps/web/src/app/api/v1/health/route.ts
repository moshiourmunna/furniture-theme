import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { json } from '@/server/http';

export const GET = api(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return json({ status: 'ok', time: new Date().toISOString() });
});
