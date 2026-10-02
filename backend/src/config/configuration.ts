import { EnvironmentVariables } from './env.validation';

export type AppConfiguration = {
  app: {
    env: string;
    port: number;
    corsOrigin: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  seed: {
    demoScenario: boolean;
  };
};

export function buildConfiguration(
  env: EnvironmentVariables,
): AppConfiguration {
  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      corsOrigin: env.CORS_ORIGIN,
    },
    database: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME,
      ssl: env.DATABASE_SSL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    seed: {
      demoScenario: env.SEED_DEMO_SCENARIO === 'true',
    },
  };
}
