import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * The secret a developer gets for free when JWT_SECRET is absent.
 *
 * It exists so a fresh clone boots, but it is published in this repository, so
 * anyone who has read it can mint a valid session cookie. Production refuses it
 * by identity and `main.ts` warns whenever it is in use. Exported so the guard
 * and the warning compare against one constant instead of a repeated literal.
 */
export const INSECURE_DEV_JWT_SECRET =
  'dev-only-insecure-secret-change-me-32-chars';

/**
 * The placeholder shipped in `.env.example`.
 *
 * Docker Compose's `${JWT_SECRET:?...}` refuses only an *absent* value, so an
 * operator who copies `.env.example` without editing it satisfies Compose and
 * still boots on a secret that is equally public. Production refuses it too.
 */
export const PLACEHOLDER_JWT_SECRET =
  'change-me-to-a-long-random-string-at-least-32-chars';

/**
 * Secrets that are long enough to satisfy a length rule but are still public,
 * so the production guard has to match them literally. A minimum-length check
 * on its own would wave both of these straight through.
 */
const FORBIDDEN_PRODUCTION_SECRETS: readonly string[] = [
  INSECURE_DEV_JWT_SECRET,
  PLACEHOLDER_JWT_SECRET,
];

const MIN_PRODUCTION_SECRET_LENGTH = 32;

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string = 'postgres';

  @IsString()
  DATABASE_PASSWORD: string = '';

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string = 'dhaka_tesla_pool';

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DATABASE_SSL: boolean = false;

  // `@IsNotEmpty` only rejects an empty string, so it cannot catch this default
  // being used in production. That rule needs NODE_ENV too, so it lives in
  // validateRelationalRules below rather than on this property.
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string = INSECURE_DEV_JWT_SECRET;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  @IsNotEmpty()
  SEED_DEMO_SCENARIO: string = 'false';
}

/**
 * Rules that depend on more than one field, which the decorators above cannot
 * express: a value is only wrong in combination with NODE_ENV.
 */
function validateRelationalRules(env: EnvironmentVariables): string[] {
  if (env.NODE_ENV !== NodeEnv.Production) {
    return [];
  }

  const problems: string[] = [];

  if (FORBIDDEN_PRODUCTION_SECRETS.includes(env.JWT_SECRET)) {
    problems.push(
      `  - JWT_SECRET: the built-in development secret and the .env.example placeholder are both published in this repository, so neither can sign production sessions. Generate a replacement with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`,
    );
  }

  if (env.JWT_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
    problems.push(
      `  - JWT_SECRET: must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production (received ${env.JWT_SECRET.length})`,
    );
  }

  return problems;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  const details = errors.map(
    (error) =>
      `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
  );
  details.push(...validateRelationalRules(validated));

  // Decorator failures and relational failures are reported together so a
  // misconfigured deployment sees every problem at once, rather than fixing one
  // variable per restart.
  if (details.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${details.join('\n')}`,
    );
  }

  return validated;
}
