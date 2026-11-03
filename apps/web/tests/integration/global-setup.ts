import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testDatabaseUrl } from './test-db';

/** Applies migrations and loads the deterministic seed into the *_test database once per run. */
export default function setup() {
  const cwd = fileURLToPath(new URL('../../../../packages/db', import.meta.url));
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl() };
  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'pipe' });
  execSync('npx tsx prisma/seed.ts', { cwd, env, stdio: 'pipe' });
}
