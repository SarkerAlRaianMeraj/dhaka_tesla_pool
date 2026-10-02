/**
 * Runs before any e2e suite. Points the suite at the dedicated test database so a
 * test run can never truncate or seed the database a developer is using.
 * Values already present in the environment win, which lets CI override the name.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_NAME = process.env.TEST_DATABASE_NAME ?? 'dhaka_tesla_pool_test';
process.env.SEED_DEMO_SCENARIO = 'false';