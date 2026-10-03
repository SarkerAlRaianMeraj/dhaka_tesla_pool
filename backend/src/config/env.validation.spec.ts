import { buildConfiguration } from './configuration';
import {
  INSECURE_DEV_JWT_SECRET,
  NodeEnv,
  PLACEHOLDER_JWT_SECRET,
  validateEnv,
} from './env.validation';

/**
 * The environment validator is the first thing that runs on boot and the last
 * line of defence before a misconfigured deployment reaches the database, so its
 * behaviour is pinned here rather than discovered in production.
 */
describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: '5432',
    DATABASE_USER: 'postgres',
    DATABASE_PASSWORD: 'secret',
    DATABASE_NAME: 'dhaka_tesla_pool_test',
    DATABASE_SSL: 'false',
    JWT_SECRET: 'a'.repeat(48),
    JWT_EXPIRES_IN: '1d',
    CORS_ORIGIN: 'http://localhost:3001',
  };

  it('accepts a complete environment and coerces string numbers', () => {
    const env = validateEnv({ ...validEnv });

    expect(env.NODE_ENV).toBe(NodeEnv.Test);
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_PORT).toBe(5432);
    expect(env.DATABASE_SSL).toBe(false);
  });

  it('falls back to development defaults when optional values are absent', () => {
    const env = validateEnv({
      ...validEnv,
      PORT: undefined,
      DATABASE_NAME: undefined,
    });

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_NAME).toBe('dhaka_tesla_pool');
    expect(env.DATABASE_HOST).toBe('localhost');
    expect(env.SEED_DEMO_SCENARIO).toBe('false');
  });

  it('rejects a non-numeric PORT and names the variable that failed', () => {
    expect(() => validateEnv({ ...validEnv, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects a PORT outside the valid TCP range', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '70000' })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV instead of silently running as production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejects a missing JWT_SECRET', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: '' })).toThrow(
      /JWT_SECRET/,
    );
  });

  describe('in production', () => {
    const productionEnv = { ...validEnv, NODE_ENV: 'production' };

    it('refuses the built-in development secret when JWT_SECRET is absent', () => {
      expect(() =>
        validateEnv({ ...productionEnv, JWT_SECRET: undefined }),
      ).toThrow(/JWT_SECRET/);
    });

    it('refuses the built-in development secret when it is set explicitly', () => {
      expect(() =>
        validateEnv({ ...productionEnv, JWT_SECRET: INSECURE_DEV_JWT_SECRET }),
      ).toThrow(/JWT_SECRET/);
    });

    it('refuses the placeholder shipped in .env.example', () => {
      expect(() =>
        validateEnv({ ...productionEnv, JWT_SECRET: PLACEHOLDER_JWT_SECRET }),
      ).toThrow(/JWT_SECRET/);
    });

    it('refuses a secret too short to be unguessable', () => {
      expect(() =>
        validateEnv({ ...productionEnv, JWT_SECRET: 'a'.repeat(16) }),
      ).toThrow(/at least 32 characters/);
    });

    it('accepts a real secret of sufficient length', () => {
      const env = validateEnv({ ...productionEnv, JWT_SECRET: 'c'.repeat(48) });

      expect(env.JWT_SECRET).toBe('c'.repeat(48));
    });

    it('reports decorator and relational failures in one message', () => {
      let message = '';

      try {
        validateEnv({
          ...productionEnv,
          PORT: 'abc',
          JWT_SECRET: PLACEHOLDER_JWT_SECRET,
        });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toMatch(/PORT/);
      expect(message).toMatch(/JWT_SECRET/);
    });
  });

  it('still falls back to the development secret outside production', () => {
    const env = validateEnv({ ...validEnv, JWT_SECRET: undefined });

    expect(env.JWT_SECRET).toBe(INSECURE_DEV_JWT_SECRET);
  });

  it('treats a missing DATABASE_PASSWORD as empty rather than the string undefined', () => {
    const env = validateEnv({ ...validEnv, DATABASE_PASSWORD: undefined });

    expect(env.DATABASE_PASSWORD).toBe('');
  });
});

describe('buildConfiguration', () => {
  it('maps the environment onto the namespaced config the application reads', () => {
    const config = buildConfiguration(
      validateEnv({
        NODE_ENV: 'test',
        PORT: '4100',
        DATABASE_HOST: 'db',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'secret',
        DATABASE_NAME: 'dhaka_tesla_pool',
        DATABASE_SSL: 'true',
        JWT_SECRET: 'b'.repeat(48),
        JWT_EXPIRES_IN: '2h',
        CORS_ORIGIN: 'http://localhost:3001',
      }),
    );

    expect(config.app).toEqual({
      env: 'test',
      port: 4100,
      corsOrigin: 'http://localhost:3001',
    });
    expect(config.database).toMatchObject({
      host: 'db',
      username: 'postgres',
      password: 'secret',
      database: 'dhaka_tesla_pool',
      ssl: true,
    });
    expect(config.jwt).toEqual({ secret: 'b'.repeat(48), expiresIn: '2h' });
  });
});
