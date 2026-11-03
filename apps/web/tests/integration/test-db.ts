/** Resolves the integration-test database and refuses anything that isn't clearly a throwaway test DB. */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL || 'mysql://shekor:shekor_dev_pw@127.0.0.1:3306/shekor_test';
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!/_test$/.test(name)) throw new Error(`TEST_DATABASE_URL must point at a database ending in _test (got "${name}")`);
  return url;
}
