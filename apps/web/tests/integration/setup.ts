import { vi } from 'vitest';
import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.SMS_PROVIDER = 'mock';
process.env.PAYMENT_MODE = 'mock';
process.env.DISABLE_RATE_LIMIT = '1';
process.env.STORAGE_LOCAL_DIR = '/tmp/shekor-test-uploads';
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: <T>(fn: T) => fn }));
