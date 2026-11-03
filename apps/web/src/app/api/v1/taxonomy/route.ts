import { api } from '@/server/route';
import { json } from '@/server/http';
import { taxonomy } from '@/server/services/catalog';
import { listZones } from '@/server/services/content';

export const GET = api(async () => json({ ...(await taxonomy()), deliveryZones: await listZones() }));
